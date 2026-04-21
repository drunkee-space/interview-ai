import { CodingWorkspace } from "@/components/coding/CodingWorkspace";
import { use } from "react";

export default function CodingRoomPage({
    params,
    searchParams,
}: {
    params: Promise<{ sessionId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = use(params);
    const sessionId = resolvedParams.sessionId;

    // Unwrap search parameters to get the underlying values
    const resolvedSearchParams = use(searchParams);
    
    // Priority: explicit type param → trackId (legacy) → fallback to python
    // The InterviewRoom now passes type=config.primary_topic which maps to language config
    const type = (resolvedSearchParams.type as string) || "python";
    const trackId = (resolvedSearchParams.trackId as string) || "";

    return <CodingWorkspace sessionId={sessionId} type={type} trackId={trackId} />;
}
