package com.echo.user.service;

import com.echo.user.dto.response.ConnectionResponse;
import com.echo.user.dto.response.PendingSyncResponse;
import com.echo.user.entity.SyncConnection;
import com.echo.user.entity.SyncStatus;
import com.echo.user.entity.User;
import com.echo.user.repository.SyncConnectionRepository;
import com.echo.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SyncService {

    private final SyncConnectionRepository syncRepository;

    // NEW: We need the UserRepository to fetch the sender's username and profile picture
    private final UserRepository userRepository;

    public void sendSyncRequest(UUID senderId, UUID receiverId, String trackId) {
        if (syncRepository.existsBySenderIdAndReceiverId(senderId, receiverId)) {
            throw new RuntimeException("Sync request already pending or accepted.");
        }

        SyncConnection connection = SyncConnection.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .icebreakerTrackId(trackId)
                .status(SyncStatus.PENDING)
                .build();

        syncRepository.save(connection);
    }

    public void acceptSync(UUID syncId, UUID receiverId) {
        SyncConnection connection = syncRepository.findById(syncId)
                .orElseThrow(() -> new RuntimeException("Sync request not found"));

        if (!connection.getReceiverId().equals(receiverId)) {
            throw new RuntimeException("Unauthorized: You cannot accept this request.");
        }

        connection.setStatus(SyncStatus.ACCEPTED);
        syncRepository.save(connection);
    }

    // NEW: Handles the "Pass" button on the frontend
    public void declineSync(UUID syncId, UUID receiverId) {
        SyncConnection connection = syncRepository.findById(syncId)
                .orElseThrow(() -> new RuntimeException("Sync request not found"));

        if (!connection.getReceiverId().equals(receiverId)) {
            throw new RuntimeException("Unauthorized: You cannot decline this request.");
        }

        // Deleting the connection entirely is usually best for declined requests
        // so they can potentially try to sync again in the future.
        syncRepository.delete(connection);
    }

    // NEW: Fetches pending requests and maps sender data for the notification bell
    public List<PendingSyncResponse> getPendingRequestsForUser(UUID receiverId) {

        List<SyncConnection> pendingConnections = syncRepository
                .findByReceiverIdAndStatus(receiverId, SyncStatus.PENDING);

        return pendingConnections.stream().map(conn -> {

            // Look up the user who sent the request
            User sender = userRepository.findById(conn.getSenderId())
                    .orElseThrow(() -> new RuntimeException("Sender not found"));

            return PendingSyncResponse.builder()
                    .syncId(conn.getId())
                    .senderId(sender.getId())
                    .senderUsername(sender.getUsername())
                    .senderProfilePic(sender.getProfileImageUrl())
                    .icebreakerTrackId(conn.getIcebreakerTrackId())
                    .build();

        }).collect(Collectors.toList());
    }

    public List<UUID> getAcceptedConnectionIds(UUID myUserId) {
        // Pass SyncStatus.ACCEPTED as the second argument
        return syncRepository.findAcceptedConnectionsForUser(myUserId, SyncStatus.ACCEPTED).stream()
                .map(conn -> conn.getSenderId().equals(myUserId) ? conn.getReceiverId() : conn.getSenderId())
                .collect(Collectors.toList());
    }

    public List<ConnectionResponse> getGroupiesDetails(UUID myUserId) {
        List<SyncConnection> connections = syncRepository.findAcceptedConnectionsForUser(myUserId, SyncStatus.ACCEPTED);

        return connections.stream().map(conn -> {
            UUID friendId = conn.getSenderId().equals(myUserId) ? conn.getReceiverId() : conn.getSenderId();
            User friend = userRepository.findById(friendId).orElseThrow(() -> new RuntimeException("User not found"));

            return ConnectionResponse.builder()
                    .userId(friend.getId())
                    .username(friend.getUsername()) // Use getUsername() if your entity requires it
                    .profileImageUrl(friend.getProfileImageUrl())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void removeSync(UUID myUserId, UUID friendId) {
        // Fetch ALL connections between these two users (to catch the duplicates)
        List<SyncConnection> connections = syncRepository.findAll().stream()
                .filter(c -> (c.getSenderId().equals(myUserId) && c.getReceiverId().equals(friendId)) ||
                        (c.getSenderId().equals(friendId) && c.getReceiverId().equals(myUserId)))
                .toList();

        if (!connections.isEmpty()) {
            syncRepository.deleteAll(connections); // Wipes the duplicates clean!
        }
    }


}