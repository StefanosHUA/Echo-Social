package com.echo.user.repository;

import com.echo.user.entity.UserTaste;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserTasteRepository extends JpaRepository<UserTaste, UUID> {
    // This will be useful later to fetch a user's top artists for the feed matching
    List<UserTaste> findAllByUserId(UUID userId);
    List<UserTaste> findByUserId(UUID userId);
    void deleteByUserId(UUID userId);
    List<UserTaste> findByUserIdIn(List<UUID> userIds);
}