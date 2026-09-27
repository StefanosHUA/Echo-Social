package com.echo.user.controller;

import com.echo.user.dto.request.ArtistDTO;
import com.echo.user.security.JwtService;
import com.echo.user.service.TasteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tastes")
@RequiredArgsConstructor
public class TasteController {

    private final TasteService tasteService;
    private final JwtService jwtService;

    @PostMapping("/onboard")
    public ResponseEntity<?> onboardTastes(
            @RequestBody List<ArtistDTO> artists,
            @RequestHeader("Authorization") String authHeader) {

        if (artists == null || artists.size() < 3) {
            return ResponseEntity.badRequest().body("You must select at least 3 artists.");
        }

        UUID userId = extractUserId(authHeader);
        tasteService.saveInitialTastes(userId, artists);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<List<ArtistDTO>> getMyTastes(@RequestHeader("Authorization") String authHeader) {
        UUID userId = extractUserId(authHeader);
        return ResponseEntity.ok(tasteService.getUserTastes(userId));
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateTastes(
            @RequestBody List<ArtistDTO> artists,
            @RequestHeader("Authorization") String authHeader) {

        if (artists == null || artists.size() < 3) {
            return ResponseEntity.badRequest().body("You must have at least 3 artists on rotation.");
        }

        UUID userId = extractUserId(authHeader);
        tasteService.updateUserTastes(userId, artists);
        return ResponseEntity.ok("Artists updated successfully");
    }

    private UUID extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return UUID.fromString(jwtService.extractClaim(token, claims -> claims.get("userId", String.class)));
    }
}