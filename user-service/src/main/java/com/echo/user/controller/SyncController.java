package com.echo.user.controller;

import com.echo.user.dto.response.ConnectionResponse;
import com.echo.user.dto.response.PendingSyncResponse;
import com.echo.user.security.JwtService;
import com.echo.user.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;
    private final JwtService jwtService;

    @PostMapping("/request/{receiverId}")
    public ResponseEntity<Void> sendSync(
            @PathVariable UUID receiverId,
            @RequestParam String trackId,
            @RequestHeader("Authorization") String authHeader) {
        UUID senderId = extractUserId(authHeader);
        syncService.sendSyncRequest(senderId, receiverId, trackId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/accept/{syncId}")
    public ResponseEntity<Void> acceptSync(
            @PathVariable UUID syncId,
            @RequestHeader("Authorization") String authHeader) {
        UUID receiverId = extractUserId(authHeader);
        syncService.acceptSync(syncId, receiverId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/decline/{syncId}")
    public ResponseEntity<?> declineSync(
            @PathVariable UUID syncId,
            @RequestHeader("Authorization") String authHeader) {
        UUID userId = extractUserId(authHeader);
        syncService.declineSync(syncId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/pending")
    public ResponseEntity<List<PendingSyncResponse>> getPendingRequests(
            @RequestHeader("Authorization") String authHeader) {
        UUID userId = extractUserId(authHeader);
        List<PendingSyncResponse> pendingSyncs = syncService.getPendingRequestsForUser(userId);
        return ResponseEntity.ok(pendingSyncs);
    }

    @GetMapping("/connections")
    public ResponseEntity<List<UUID>> getMyConnections(@RequestHeader("Authorization") String authHeader) {
        UUID userId = extractUserId(authHeader);
        return ResponseEntity.ok(syncService.getAcceptedConnectionIds(userId));
    }

    private UUID extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return UUID.fromString(jwtService.extractClaim(token, claims -> claims.get("userId", String.class)));
    }

    @GetMapping("/groupies/details")
    public ResponseEntity<List<ConnectionResponse>> getGroupiesDetails(@RequestHeader("Authorization") String authHeader) {
        UUID userId = extractUserId(authHeader);
        return ResponseEntity.ok(syncService.getGroupiesDetails(userId));
    }

    @DeleteMapping("/remove/{friendId}")
    public ResponseEntity<Void> removeSync(
            @PathVariable UUID friendId,
            @RequestHeader("Authorization") String authHeader) {
        UUID userId = extractUserId(authHeader);
        syncService.removeSync(userId, friendId);
        return ResponseEntity.ok().build();
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(RuntimeException ex) {
        if (ex.getMessage().contains("already pending or accepted")) {
            return ResponseEntity.badRequest().body("You are already connected with this user.");
        }
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}