import { InterviewRoom } from "@/components/interview/InterviewRoom";

export default async function InterviewPage({
    params,
    searchParams,
}: {
    params: Promise<{ sessionId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { sessionId } = await params;
    const resolvedSearchParams = await searchParams;
    const trackId = (resolvedSearchParams.trackId as string) || "";

    return <InterviewRoom sessionId={sessionId} trackId={trackId} />;
}
