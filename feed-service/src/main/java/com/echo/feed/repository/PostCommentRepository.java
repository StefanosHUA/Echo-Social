package com.echo.feed.repository;

import com.echo.feed.entity.PostComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostCommentRepository extends JpaRepository<PostComment, UUID> {
    List<PostComment> findByPostIdOrderByCreatedAtAsc(UUID postId);

    // New batch fetch method
    List<PostComment> findByPostIdInOrderByCreatedAtAsc(List<UUID> postIds);
}