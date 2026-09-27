package com.echo.user.repository;

import com.echo.user.entity.SyncConnection;
import com.echo.user.entity.SyncStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface SyncConnectionRepository extends JpaRepository<SyncConnection, UUID> {
    boolean existsBySenderIdAndReceiverId(UUID senderId, UUID receiverId);
    List<SyncConnection> findByReceiverIdAndStatus(UUID receiverId, SyncStatus status);
    @Query("SELECT c FROM SyncConnection c WHERE (c.senderId = :userId OR c.receiverId = :userId) AND c.status = :status")
    List<SyncConnection> findAcceptedConnectionsForUser(
            @Param("userId") UUID userId,
            @Param("status") SyncStatus status
    );
    @Query("SELECT c FROM SyncConnection c WHERE (c.senderId = :user1 AND c.receiverId = :user2) OR (c.senderId = :user2 AND c.receiverId = :user1)")
    java.util.Optional<SyncConnection> findConnectionBetweenUsers(@org.springframework.data.repository.query.Param("user1") UUID user1, @org.springframework.data.repository.query.Param("user2") UUID user2);
}