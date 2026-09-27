package com.echo.feed.service;

import com.echo.feed.dto.request.LikeRequest;
import com.echo.feed.dto.response.LikeResponse;
import com.echo.feed.entity.Post;
import com.echo.feed.entity.PostLike;
import com.echo.feed.repository.PostLikeRepository;
import com.echo.feed.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;

    @Transactional
    public LikeResponse toggleLike(UUID postId, LikeRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + postId));

        Optional<PostLike> existingLike = postLikeRepository.findByPostIdAndUserId(postId, request.getUserId());

        boolean isLiked;
        if (existingLike.isPresent()) {
            // User already liked it: Unlike (remove like record & decrement count)
            postLikeRepository.delete(existingLike.get());
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            isLiked = false;
        } else {
            // User hasn't liked it: Add like record & increment count
            PostLike newLike = PostLike.builder()
                    .post(post)
                    .userId(request.getUserId())
                    .build();
            postLikeRepository.save(newLike);
            post.setLikeCount(post.getLikeCount() + 1);
            isLiked = true;
        }

        postRepository.save(post);

        return LikeResponse.builder()
                .postId(post.getId())
                .likeCount(post.getLikeCount())
                .liked(isLiked)
                .build();
    }
}