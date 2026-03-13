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
    const type = (resolvedSearchParams.type as string) || "python";

    return <InterviewRoom sessionId={sessionId} type={type} />;
}
