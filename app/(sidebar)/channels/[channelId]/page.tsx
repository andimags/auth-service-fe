import { fetchWithAccessResult } from "@/lib/fetch-with-access-result"
import { getChannel } from "@/services/channel.service"
import ChannelInformation from "./ChannelInformation"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function Page({
    params,
}: Readonly<{
    params: Promise<{ channelId: string }>
}>) {
    const { channelId } = await params

    const channelResult = await fetchWithAccessResult(
        (auth) => getChannel({ channelId, ...auth }),
        null
    )

    if (!channelResult.allowed || !channelResult.data) {
        redirect("/403")
    }

    if(channelResult.allowed){
        return <ChannelInformation channel={channelResult.data} />
    }
}
