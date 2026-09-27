package com.echo.feed.controller;

import com.echo.feed.dto.request.CreatePostRequest;
import com.echo.feed.dto.response.FeedPageResponse;
import com.echo.feed.dto.response.PostResponse;
import com.echo.feed.repository.PostRepository;
import com.echo.feed.security.JwtService;
import com.echo.feed.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostRepository postRepository;
    private final PostService postService;
    private final JwtService jwtService;

    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @Valid @RequestBody CreatePostRequest request,
            @RequestHeader("Authorization") String authHeader
    ) {
        String token = authHeader.substring(7);
        UUID userId = jwtService.extractUserId(token);

        PostResponse response = postService.createPost(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<FeedPageResponse> getFeed(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String token = authHeader.substring(7);
        UUID userId = jwtService.extractUserId(token);

        FeedPageResponse feed = postService.getPersonalizedFeed(userId, token, page, size);
        return ResponseEntity.ok(feed);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String userIdStr = jwtService.extractClaim(token, claims -> claims.get("userId", String.class));
        UUID userId = UUID.fromString(userIdStr);

        postService.deletePost(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user/{targetUserId}")
    public ResponseEntity<FeedPageResponse> getUserPosts(
            @PathVariable UUID targetUserId,
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String token = authHeader.substring(7);
        FeedPageResponse feed = postService.getUserPosts(targetUserId, token, page, size);
        return ResponseEntity.ok(feed);
    }
}