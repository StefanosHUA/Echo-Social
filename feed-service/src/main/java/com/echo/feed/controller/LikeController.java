package com.echo.feed.controller;

import com.echo.feed.dto.request.LikeRequest;
import com.echo.feed.dto.response.LikeResponse;
import com.echo.feed.service.LikeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts/{postId}/likes")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    @PostMapping("/toggle")
    public ResponseEntity<LikeResponse> toggleLike(
            @PathVariable UUID postId,
            @Valid @RequestBody LikeRequest request) {
        LikeResponse response = likeService.toggleLike(postId, request);
        return ResponseEntity.ok(response);
    }
}