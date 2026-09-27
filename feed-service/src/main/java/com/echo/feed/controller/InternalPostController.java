package com.echo.feed.controller;

import com.echo.feed.dto.response.ActivityDto;
import com.echo.feed.entity.Post;
import com.echo.feed.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/posts/internal")
@RequiredArgsConstructor
public class InternalPostController {

    private final PostRepository postRepository;

    @PostMapping("/activity")
    public Map<UUID, List<ActivityDto>> getUsersActivity(@RequestBody List<UUID> userIds) {
        List<Post> posts = postRepository.findByUserIdIn(userIds);

        return posts.stream().collect(
                Collectors.groupingBy(
                        Post::getUserId,
                        Collectors.mapping(post -> new ActivityDto(post.getSpotifyTrackUri()), Collectors.toList())
                )
        );
    }
}