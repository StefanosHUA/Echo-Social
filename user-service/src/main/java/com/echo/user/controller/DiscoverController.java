package com.echo.user.controller;

import com.echo.user.dto.response.GroupieResponse;
import com.echo.user.security.JwtService;
import com.echo.user.service.DiscoverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/discover")
@RequiredArgsConstructor
public class DiscoverController {

    private final DiscoverService discoverService;
    private final JwtService jwtService;

    @GetMapping("/groupies")
    public ResponseEntity<List<GroupieResponse>> getGroupies(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        UUID userId = UUID.fromString(jwtService.extractClaim(token, claims -> claims.get("userId", String.class)));

        return ResponseEntity.ok(discoverService.discoverGroupies(userId));
    }
}