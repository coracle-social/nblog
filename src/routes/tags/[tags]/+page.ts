import type { PageLoad } from "./$types";
import Nostr from "$lib/Nostr"
import type { Event } from "nostr-tools"
import { getTagValues } from "$lib/util";
import { error } from "@sveltejs/kit";

export const ssr = true;
export const csr = false;

export const load = (async ({ params }) => {
    const nostrClient = new Nostr()
    try {
        await nostrClient.connect()
    } catch (err) {
        throw error(500, {
            message: "Couldn't connect to relays"
        })
    }
    const tagArr = params.tags.split(",")
    const sub = nostrClient.sub(nostrClient.relays, [
        {
            kinds: [30023],
            "#t": tagArr,
            authors: nostrClient.pubkeys
        }
    ])

    const posts: Event[] = [];

    sub.on('event', (event: Event) => {
        posts.push(event)
    })

    return {
        posts: new Promise<Event[]>((resolve) => {
            sub.on('eose', () => {
                sub.unsub()
                posts.sort((a, b) => Number(getTagValues(b.tags, "published_at")![0]) - Number(getTagValues(a.tags, "published_at")![0]))
                resolve(posts)
            })
        }),
        tags: tagArr,
    }
}) satisfies PageLoad;