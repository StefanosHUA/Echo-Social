package com.echo.feed.service;

import com.echo.feed.dto.request.CreatePostRequest;
import com.echo.feed.dto.response.CommentResponse;
import com.echo.feed.dto.response.FeedPageResponse;
import com.echo.feed.dto.response.PostResponse;
import com.echo.feed.entity.Post;
import com.echo.feed.exception.ResourceNotFoundException;
import com.echo.feed.exception.UnauthorizedOperationException;
import com.echo.feed.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final CommentService commentService;
    private final RestTemplate restTemplate;

    public FeedPageResponse getPersonalizedFeed(UUID currentUserId, String jwtToken, int pageNo, int pageSize) {
        List<UUID> allowedUserIds = new ArrayList<>();
        allowedUserIds.add(currentUserId);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + jwtToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<UUID[]> response = restTemplate.exchange(
                    "http://localhost:8081/api/sync/connections",
                    HttpMethod.GET,
                    entity,
                    UUID[].class
            );
            if (response.getBody() != null) {
                allowedUserIds.addAll(Arrays.asList(response.getBody()));
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch connections. Defaulting to own posts: " + e.getMessage());
        }

        Pageable pageable = PageRequest.of(pageNo, pageSize);
        Page<Post> postPage = postRepository.findByUserIdInOrderByCreatedAtDesc(allowedUserIds, pageable);

        List<Post> posts = postPage.getContent();
        List<UUID> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());
        java.util.Map<UUID, List<CommentResponse>> groupedComments = commentService.getCommentsForPosts(postIds);

        List<PostResponse> postResponses = posts.stream()
                .map(post -> {
                    List<CommentResponse> comments = groupedComments.getOrDefault(post.getId(), List.of());
                    // Pass the current user's ID down to evaluate the like status
                    return mapToResponse(post, comments, currentUserId);
                })
                .collect(Collectors.toList());

        return FeedPageResponse.builder()
                .content(postResponses)
                .pageNo(postPage.getNumber())
                .pageSize(postPage.getSize())
                .totalElements(postPage.getTotalElements())
                .totalPages(postPage.getTotalPages())
                .last(postPage.isLast())
                .build();
    }

    @Transactional
    public PostResponse createPost(CreatePostRequest request, UUID userId) {
        Post post = Post.builder()
                .userId(userId)
                .username(request.getUsername())
                .profileImageUrl(request.getProfileImageUrl())
                .spotifyTrackUri(request.getSpotifyTrackUri())
                .trackName(request.getTrackName())
                .artistName(request.getArtistName())
                .albumCoverUrl(request.getAlbumCoverUrl())
                .caption(request.getCaption())
                .likeCount(0L)
                .build();

        Post savedPost = postRepository.save(post);

        // Pass the creator's ID down so the UI knows they haven't liked their new post yet
        return mapToResponse(savedPost, List.of(), userId);
    }

    @Transactional(readOnly = true)
    public FeedPageResponse getFeed(int pageNo, int pageSize) {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        Page<Post> postPage = postRepository.findAllByOrderByCreatedAtDesc(pageable);

        List<Post> posts = postPage.getContent();
        List<UUID> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());

        java.util.Map<UUID, List<CommentResponse>> groupedComments = commentService.getCommentsForPosts(postIds);

        List<PostResponse> postResponses = posts.stream()
                .map(post -> {
                    List<CommentResponse> comments = groupedComments.getOrDefault(post.getId(), List.of());
                    // Passing null here because getFeed doesn't currently take the logged-in user's ID.
                    // If you want likes to persist on a public "Explore" feed, add UUID currentUserId to getFeed's parameters!
                    return mapToResponse(post, comments, null);
                })
                .collect(Collectors.toList());

        return FeedPageResponse.builder()
                .content(postResponses)
                .pageNo(postPage.getNumber())
                .pageSize(postPage.getSize())
                .totalElements(postPage.getTotalElements())
                .totalPages(postPage.getTotalPages())
                .last(postPage.isLast())
                .build();
    }

    public FeedPageResponse getUserPosts(UUID targetUserId, String jwtToken, int pageNo, int pageSize) {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        Page<Post> postPage = postRepository.findByUserIdOrderByCreatedAtDesc(targetUserId, pageable);

        List<Post> posts = postPage.getContent();
        List<UUID> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());
        java.util.Map<UUID, List<CommentResponse>> groupedComments = commentService.getCommentsForPosts(postIds);

        List<PostResponse> postResponses = posts.stream()
                .map(post -> {
                    List<CommentResponse> comments = groupedComments.getOrDefault(post.getId(), List.of());
                    // Passing null here for now. If you want likes to persist on the Profile page,
                    // add UUID currentUserId to the signature of this method!
                    return mapToResponse(post, comments, null);
                })
                .collect(Collectors.toList());

        return FeedPageResponse.builder()
                .content(postResponses)
                .pageNo(postPage.getNumber())
                .pageSize(postPage.getSize())
                .totalElements(postPage.getTotalElements())
                .totalPages(postPage.getTotalPages())
                .last(postPage.isLast())
                .build();
    }

    @Transactional
    public void deletePost(UUID postId, UUID userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with ID: " + postId));

        if (!post.getUserId().equals(userId)) {
            throw new UnauthorizedOperationException("You do not have permission to delete this post.");
        }

        postRepository.delete(post);
    }

    // --- UPDATED MAPPER ---
    private PostResponse mapToResponse(Post post, List<CommentResponse> comments, UUID currentUserId) {

        boolean hasLiked = false;

        // Null-safe check to see if the viewing user exists in the post's list of likes
        if (currentUserId != null && post.getLikes() != null) {
            hasLiked = post.getLikes().stream()
                    .anyMatch(like -> currentUserId.equals(like.getUserId()));
        }

        return PostResponse.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .username(post.getUsername())
                .profileImageUrl(post.getProfileImageUrl())
                .spotifyTrackUri(post.getSpotifyTrackUri())
                .trackName(post.getTrackName())
                .artistName(post.getArtistName())
                .albumCoverUrl(post.getAlbumCoverUrl())
                .caption(post.getCaption())
                .likeCount(post.getLikeCount())
                .createdAt(post.getCreatedAt())
                .comments(comments)
                .likedByCurrentUser(hasLiked) // Injecting the boolean flag into the DTO
                .build();
    }
}