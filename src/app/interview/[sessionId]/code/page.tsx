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
    const type = (resolvedSearchParams.type as string) || "python";

    return <CodingWorkspace sessionId={sessionId} type={type} />;
}
