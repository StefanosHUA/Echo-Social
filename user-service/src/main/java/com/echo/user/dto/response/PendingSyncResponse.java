package com.echo.user.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class PendingSyncResponse {
    private UUID syncId;
    private UUID senderId;
    private String senderUsername;
    private String senderProfilePic;
    private String icebreakerTrackId;
}