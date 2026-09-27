package com.echo.user.controller;

import com.echo.user.dto.request.PasswordUpdateRequest;
import com.echo.user.dto.request.ProfileUpdateRequest;
import com.echo.user.entity.User;
import com.echo.user.repository.UserRepository;
import com.echo.user.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody ProfileUpdateRequest request,
            @RequestHeader("Authorization") String authHeader) {

        User user = getAuthenticatedUser(authHeader);

        if (request.getUsername() != null) user.setUsername(request.getUsername());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getProfileImageUrl() != null) user.setProfileImageUrl(request.getProfileImageUrl());

        userRepository.save(user);
        return ResponseEntity.ok("Profile updated successfully");
    }

    @PutMapping("/password")
    public ResponseEntity<?> updatePassword(
            @RequestBody PasswordUpdateRequest request,
            @RequestHeader("Authorization") String authHeader) {

        User user = getAuthenticatedUser(authHeader);

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Incorrect current password.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok("Password updated successfully");
    }

    private User getAuthenticatedUser(String authHeader) {
        String token = authHeader.substring(7);
        String userIdStr = jwtService.extractClaim(token, claims -> claims.get("userId", String.class));
        return userRepository.findById(UUID.fromString(userIdStr))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);

        return ResponseEntity.ok(java.util.Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "profileImageUrl", user.getProfileImageUrl() != null ? user.getProfileImageUrl() : ""
        ));
    }

    // NEW ENDPOINT: Fetches a specific user's basic profile details
    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserProfileById(@PathVariable UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(java.util.Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "profileImageUrl", user.getProfileImageUrl() != null ? user.getProfileImageUrl() : ""
        ));
    }
}