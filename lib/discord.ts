import { env } from "cloudflare:workers";
import { getMangaUrl } from "@/lib/manga-url";
import { toMediaUrl } from "@/lib/media";
import { formatGenreNames } from "@/data/genres";

// Lấy biến môi trường an toàn trên cả Cloudflare Workers và Node.js runtime
function getEnvVar(key: string): string | undefined {
    try {
        if (typeof env !== "undefined" && (env as any)?.[key]) {
            return String((env as any)[key]);
        }
    } catch { }
    if (typeof process !== "undefined" && process.env?.[key]) {
        return process.env[key];
    }
    return undefined;
}

/** Lấy URL website chính (tránh hardcode) */
export function getWebsiteUrl(): string {
    const url =
        getEnvVar("URL_WEBSITE") ||
        getEnvVar("NEXT_PUBLIC_SITE_URL") ||
        getEnvVar("SITE_URL") ||
        "https://yoruteam.com";
    return url.replace(/\/+$/, "");
}

/** Lấy URL Fanpage Facebook từ .env */
export function getFanpageUrl(): string {
    const url =
        getEnvVar("URL_FANPAGE") ||
        getEnvVar("FANPAGE_URL") ||
        getEnvVar("FB_FANPAGE_URL") ||
        "";
    return url.trim();
}

/** Lấy Webhook URL Discord từ .env */
export function getDiscordWebhookUrl(): string {
    const url = getEnvVar("DISCORD_WEBHOOK_URL") || "";
    return url.trim();
}

/** Tạo nhãn link Fanpage chuẩn markdown Discord */
function getFanpageMarkdownLink(): string {
    const fanpageUrl = getFanpageUrl();
    return fanpageUrl
        ? `[Fanpage Yoru Translation Group](${fanpageUrl})`
        : "Fanpage Yoru Translation Group";
}

/** Format tiêu đề hiển thị của chapter */
export function formatChapterTitle(chapter: {
    chapter: number | string;
    volume?: number | null;
    title?: string | null;
    isH?: boolean;
    isEnd?: boolean;
}): string {
    if (chapter.title && chapter.title.trim()) {
        return chapter.title.trim();
    }
    const volStr = chapter.volume ? `Vol. ${chapter.volume} — ` : "";
    const endStr = chapter.isEnd ? " - END" : "";
    const hStr = chapter.isH ? " [18+]" : "";
    return `${volStr}Chapter ${chapter.chapter}${hStr}${endStr}`;
}

export type DiscordNotification =
    | {
        type: "NEW_MANGA";
        manga: {
            id?: string;
            title: string;
            description?: string | null;
            coverUrl?: string | null;
            type?: string | null;
            genres?: string[] | unknown;
            url?: string;
        };
    }
    | {
        type: "NEW_CHAPTER";
        manga: {
            id?: string;
            title: string;
            type?: string | null;
            coverUrl?: string | null;
            url?: string;
        };
        chapter: {
            id?: string;
            chapter: number | string;
            volume?: number | null;
            title?: string;
            description?: string | null;
            imageUrl?: string | null;
            isH?: boolean;
            isEnd?: boolean;
            url?: string;
        };
    }
    | {
        type: "MANGA_END";
        manga: {
            id?: string;
            title: string;
            type?: string | null;
            coverUrl?: string | null;
            url?: string;
        };
        chapter: {
            id?: string;
            chapter: number | string;
            volume?: number | null;
            title?: string;
            description?: string | null;
            imageUrl?: string | null;
            isH?: boolean;
            isEnd?: boolean;
            url?: string;
        };
    };

/**
 * Gửi thông báo đến Discord Webhook của Yoru Translation Group
 */
export async function sendDiscordNotification(
    arg1: DiscordNotification | { DISCORD_WEBHOOK_URL?: string },
    arg2?: DiscordNotification
) {
    let webhookUrl: string | undefined;
    let data: DiscordNotification;

    if (arg2 && "type" in arg2) {
        data = arg2;
        webhookUrl = (arg1 as { DISCORD_WEBHOOK_URL?: string })?.DISCORD_WEBHOOK_URL;
    } else if (arg1 && "type" in (arg1 as DiscordNotification)) {
        data = arg1 as DiscordNotification;
    } else {
        console.warn("[Discord Webhook] Tham số không hợp lệ.");
        return { success: false, error: "Tham số không hợp lệ" };
    }

    if (!webhookUrl) {
        webhookUrl = getDiscordWebhookUrl();
    }

    if (!webhookUrl || webhookUrl === "abc" || !webhookUrl.startsWith("http")) {
        console.log(
            "[Discord Webhook] Bỏ qua gửi thông báo do DISCORD_WEBHOOK_URL chưa cấu hình hợp lệ:",
            webhookUrl
        );
        return { success: false, skipped: true };
    }

    const websiteUrl = getWebsiteUrl();
    const fanpageLink = getFanpageMarkdownLink();

    let content = "";
    let embed: any = {};

    if (data.type === "NEW_MANGA") {
        const manga = data.manga;
        const mangaUrl =
            manga.url ||
            (manga.id ? `${websiteUrl}${getMangaUrl({ id: manga.id, type: manga.type })}` : websiteUrl);

        content = "@everyone 🔥 **TRUYỆN MỚI CẬP BẾN TẠI YORU TRANSLATION GROUP!** 🔥";

        const genreList = formatGenreNames(manga.genres);

        const descSnippet = manga.description
            ? manga.description.length > 280
                ? manga.description.slice(0, 280) + "..."
                : manga.description
            : "";

        let descriptionText = `📚 **Tên truyện:** ${manga.title}\n`;
        if (manga.type) {
            descriptionText += `🏷️ **Thể loại:** ${manga.type}\n`;
        }
        if (genreList) {
            descriptionText += `🎭 **Genres:** ${genreList}\n`;
        }
        if (descSnippet) {
            descriptionText += `\n> *${descSnippet}*\n`;
        }
        descriptionText += `\n📖 [Nhấn vào đây để đọc ${manga.title}](${mangaUrl})\n`;
        descriptionText += `📌 Đừng quên theo dõi ${fanpageLink} để cập nhật tin tức mới nhất nha!`;

        embed = {
            title: `✨ [TRUYỆN MỚI] ${manga.title}`,
            url: mangaUrl,
            color: 0x8b5cf6, // Tím Yoru
            description: descriptionText,
            image: manga.coverUrl ? { url: toMediaUrl(manga.coverUrl) } : undefined,
            footer: {
                text: "Yoru Translation Group • Thông báo truyện mới",
            },
            timestamp: new Date().toISOString(),
        };
    }

    if (data.type === "NEW_CHAPTER") {
        const manga = data.manga;
        const chapter = data.chapter;

        const mangaUrl =
            manga.url ||
            (manga.id ? `${websiteUrl}${getMangaUrl({ id: manga.id, type: manga.type })}` : websiteUrl);

        const chapterUrl =
            chapter.url ||
            (chapter.id ? `${websiteUrl}/chapter/${chapter.id}` : mangaUrl);

        const chapterTitle = formatChapterTitle(chapter);

        content =
            `@everyone 🚀 **${manga.title} vừa có chương mới nè cả nhà ơi!**\n\n` +
            `🔥 **${chapterTitle}** đã chính thức cập nhật!\n\n` +
            `📖 Ghé website đọc ngay: ${chapterUrl}\n` +
            `📌 Theo dõi ${fanpageLink} để cập nhật thông báo mới nhất nha!`;

        const descSnippet = chapter.description ? `${chapter.description}\n\n` : "";

        embed = {
            title: `${manga.title} – ${chapterTitle}`,
            url: chapterUrl,
            color: 0x8b5cf6, // tím
            description:
                `${descSnippet}` +
                `📖 **Đọc ngay:** [Nhấn vào đây để đọc ${manga.title} - ${chapterTitle}](${chapterUrl})\n` +
                `📚 **Mục lục truyện:** [${manga.title}](${mangaUrl})\n\n` +
                `✨ Chúc các bạn có những giây phút đọc truyện thật vui vẻ tại **Yoru Translation Group**!\n` +
                `📌 Ghé thăm ${fanpageLink} ủng hộ nhóm nhé!`,
            image: chapter.imageUrl
                ? { url: toMediaUrl(chapter.imageUrl) }
                : manga.coverUrl
                    ? { url: toMediaUrl(manga.coverUrl) }
                    : undefined,
            footer: {
                text: "Yoru Translation Group • Thông báo chương mới",
            },
            timestamp: new Date().toISOString(),
        };
    }

    if (data.type === "MANGA_END") {
        const manga = data.manga;
        const chapter = data.chapter;

        const mangaUrl =
            manga.url ||
            (manga.id ? `${websiteUrl}${getMangaUrl({ id: manga.id, type: manga.type })}` : websiteUrl);

        const chapterUrl =
            chapter.url ||
            (chapter.id ? `${websiteUrl}/chapter/${chapter.id}` : mangaUrl);

        const chapterTitle = formatChapterTitle(chapter);

        content =
            `@everyone 🎉 **${manga.title} ĐÃ CHÍNH THỨC HOÀN THÀNH (END)!** 🎉\n\n` +
            `🏁 **${chapterTitle}** — Chương cuối cùng đã được Yoru Translation Group cập nhật trọn vẹn!\n\n` +
            `❤️ Cảm ơn tất cả mọi người đã luôn đồng hành và ủng hộ nhóm trong suốt thời gian qua!\n` +
            `📖 Đọc trọn bộ tại: ${chapterUrl}\n` +
            `📌 Đón chờ những siêu phẩm tiếp theo tại ${fanpageLink} nhé!`;

        const descSnippet = chapter.description ? `${chapter.description}\n\n` : "";

        embed = {
            title: `🏆 [HOÀN THÀNH - END] ${manga.title} – ${chapterTitle}`,
            url: chapterUrl,
            color: 0x8b5cf6, // tím
            description:
                `${descSnippet}` +
                `🎉 Hành trình của bộ truyện **${manga.title}** đã chính thức khép lại với chương kết thúc trọn vẹn!\n\n` +
                `📖 **Đọc chương kết thúc:** [Nhấn vào đây để đọc ${manga.title} - ${chapterTitle}](${chapterUrl})\n` +
                `📚 **Đọc lại toàn bộ tác phẩm:** [${manga.title}](${mangaUrl})\n\n` +
                `❤️ **Yoru Translation Group** xin gửi lời cảm ơn sâu sắc nhất tới quý độc giả đã luôn theo dõi và ủng hộ nhóm.\n` +
                `📌 Hãy theo dõi ${fanpageLink} để không bỏ lỡ các bộ truyện mới sắp ra mắt!`,
            image: chapter.imageUrl
                ? { url: toMediaUrl(chapter.imageUrl) }
                : manga.coverUrl
                    ? { url: toMediaUrl(manga.coverUrl) }
                    : undefined,
            footer: {
                text: "Yoru Translation Group • Thông báo hoàn thành",
            },
            timestamp: new Date().toISOString(),
        };
    }

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content,
                embeds: [embed],
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(
                "[Discord Webhook] Gửi thông báo thất bại:",
                response.status,
                errText
            );
            return { success: false, status: response.status, error: errText };
        }

        return { success: true };
    } catch (error) {
        console.error("[Discord Webhook] Lỗi kết nối khi gửi thông báo:", error);
        return { success: false, error };
    }
}

/**
 * Helper gửi thông báo truyện mới
 */
export async function notifyNewManga(manga: {
    id: string;
    title: string;
    description?: string | null;
    coverUrl?: string | null;
    type?: string | null;
    genres?: string[] | unknown;
}) {
    return sendDiscordNotification({
        type: "NEW_MANGA",
        manga,
    });
}

/**
 * Helper gửi thông báo chapter mới hoặc chapter kết thúc
 */
export async function notifyNewChapter(
    manga: {
        id: string;
        title: string;
        type?: string | null;
        coverUrl?: string | null;
    },
    chapter: {
        id: string;
        chapter: number | string;
        volume?: number | null;
        title?: string;
        description?: string | null;
        imageUrl?: string | null;
        isH?: boolean;
        isEnd?: boolean;
    }
) {
    return sendDiscordNotification({
        type: chapter.isEnd ? "MANGA_END" : "NEW_CHAPTER",
        manga,
        chapter,
    });
}