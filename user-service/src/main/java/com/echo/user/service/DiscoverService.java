package com.echo.user.service;

import com.echo.user.dto.response.GroupieResponse;
import com.echo.user.entity.User;
import com.echo.user.entity.UserTaste;
import com.echo.user.repository.UserRepository;
import com.echo.user.repository.UserTasteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiscoverService {

    private final UserRepository userRepository;
    private final UserTasteRepository tasteRepository;
    private final SyncService syncService;
    private final RestTemplate restTemplate;

    public List<GroupieResponse> discoverGroupies(UUID myUserId) {
        List<UUID> myConnections = syncService.getAcceptedConnectionIds(myUserId);
        List<UserTaste> myTastes = tasteRepository.findByUserId(myUserId);

        if (myTastes.isEmpty()) return Collections.emptyList();

        String myFoundationalArtist = myTastes.get(0).getSpotifyArtistId();
        Set<String> myExtraArtists = myTastes.stream().skip(1).map(UserTaste::getSpotifyArtistId).collect(Collectors.toSet());

        List<User> eligibleUsers = userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(myUserId))
                .filter(u -> !myConnections.contains(u.getId()))
                .toList();

        if (eligibleUsers.isEmpty()) return Collections.emptyList();

        List<UUID> eligibleUserIds = eligibleUsers.stream().map(User::getId).toList();

        // --- THE FIX: BULK FETCH TASTES (Avoids Hibernate N+1) ---
        List<UserTaste> allEligibleTastes = tasteRepository.findByUserIdIn(eligibleUserIds);
        Map<UUID, List<UserTaste>> tastesByUserId = allEligibleTastes.stream()
                .collect(Collectors.groupingBy(UserTaste::getUserId));

        // Bulk fetch feed history
        Map<UUID, List<Map<String, String>>> userFeedHistory = fetchUserFeedActivity(eligibleUserIds);
        Map<UUID, List<Map<String, String>>> myFeedHistory = fetchUserFeedActivity(List.of(myUserId));

        Set<String> myPostedTracks = myFeedHistory.getOrDefault(myUserId, Collections.emptyList()).stream()
                .map(t -> t.get("spotifyTrackUri"))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<GroupieResponse> recommendations = new ArrayList<>();

        for (User otherUser : eligibleUsers) {
            // Grab from the in-memory map instead of querying the database!
            List<UserTaste> theirTastes = tastesByUserId.getOrDefault(otherUser.getId(), Collections.emptyList());
            if (theirTastes.isEmpty()) continue;

            String theirFoundationalArtist = theirTastes.get(0).getSpotifyArtistId();
            int matchScore = 0;
            List<String> sharedArtistNames = new ArrayList<>();

            if (myFoundationalArtist.equals(theirFoundationalArtist)) {
                matchScore += 10;
                sharedArtistNames.add(theirTastes.get(0).getArtistName());
            }

            for (UserTaste theirTaste : theirTastes) {
                if (myExtraArtists.contains(theirTaste.getSpotifyArtistId()) && !theirTaste.getSpotifyArtistId().equals(myFoundationalArtist)) {
                    matchScore += 6;
                    sharedArtistNames.add(theirTaste.getArtistName());
                }
            }

            List<Map<String, String>> theirTracks = userFeedHistory.getOrDefault(otherUser.getId(), Collections.emptyList());
            for (Map<String, String> track : theirTracks) {
                String uri = track.get("spotifyTrackUri");
                if (uri != null && myPostedTracks.contains(uri)) {
                    matchScore += 2;
                }
            }

            if (matchScore > 0) {
                recommendations.add(GroupieResponse.builder()
                        .userId(otherUser.getId())
                        .username(otherUser.getUsername())
                        .profileImageUrl(otherUser.getProfileImageUrl())
                        .matchScore(matchScore)
                        .sharedArtistNames(sharedArtistNames.stream().distinct().collect(Collectors.toList()))
                        .build());
            }
        }

        recommendations.sort((a, b) -> Integer.compare(b.getMatchScore(), a.getMatchScore()));
        return recommendations;
    }

    private Map<UUID, List<Map<String, String>>> fetchUserFeedActivity(List<UUID> userIds) {
        try {
            ResponseEntity<Map<UUID, List<Map<String, String>>>> response = restTemplate.exchange(
                    "http://localhost:8080/api/posts/internal/activity",
                    HttpMethod.POST,
                    new HttpEntity<>(userIds),
                    new ParameterizedTypeReference<>() {}
            );
            return response.getBody() != null ? response.getBody() : new HashMap<>();
        } catch (Exception e) {
            System.err.println("Feed service unreachable: " + e.getMessage());
            return new HashMap<>();
        }
    }
}