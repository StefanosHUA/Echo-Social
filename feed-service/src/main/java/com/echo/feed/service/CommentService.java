package com.echo.feed.service;

import com.echo.feed.dto.request.AddCommentRequest;
import com.echo.feed.dto.response.CommentResponse;
import com.echo.feed.entity.Post;
import com.echo.feed.entity.PostComment;
import com.echo.feed.repository.PostCommentRepository;
import com.echo.feed.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final PostRepository postRepository;
    private final PostCommentRepository postCommentRepository;

    @Transactional
    public CommentResponse addComment(UUID postId, AddCommentRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + postId));

        PostComment comment = PostComment.builder()
                .post(post)
                .userId(request.getUserId())
                .content(request.getContent())
                .build();

        PostComment savedComment = postCommentRepository.save(comment);

        return CommentResponse.builder()
                .id(savedComment.getId())
                .userId(savedComment.getUserId())
                .content(savedComment.getContent())
                .createdAt(savedComment.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsForPost(UUID postId) {
        return postCommentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(comment -> CommentResponse.builder()
                        .id(comment.getId())
                        .userId(comment.getUserId())
                        .content(comment.getContent())
                        .createdAt(comment.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteComment(UUID postId, UUID commentId, UUID userId) {
        PostComment comment = postCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found with id: " + commentId));

        // Security check: Ensure the comment actually belongs to the post in the URL
        if (!comment.getPost().getId().equals(postId)) {
            throw new IllegalArgumentException("Comment does not belong to this post");
        }

        // Security check: Ensure the user deleting the comment is the author
        // (In the future, this userId will be extracted securely from a JWT)
        if (!comment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You do not have permission to delete this comment");
        }

        postCommentRepository.delete(comment);
    }

    @Transactional(readOnly = true)
    public java.util.Map<UUID, List<CommentResponse>> getCommentsForPosts(List<UUID> postIds) {
        if (postIds.isEmpty()) return java.util.Collections.emptyMap();

        List<PostComment> comments = postCommentRepository.findByPostIdInOrderByCreatedAtAsc(postIds);

        // Group the comments by the Post ID
        return comments.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        comment -> comment.getPost().getId(),
                        java.util.stream.Collectors.mapping(comment -> CommentResponse.builder()
                                .id(comment.getId())
                                .userId(comment.getUserId())
                                .content(comment.getContent())
                                .createdAt(comment.getCreatedAt())
                                .build(), java.util.stream.Collectors.toList())
                ));
    }

}