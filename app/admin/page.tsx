"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import JSZip from "jszip";

/* =========================================================
TYPE
========================================================= */

type Genre = {
  id: string;
  name: string;
};

type ZipImage = {
  name: string;
  size: number;
  url: string;
  order: number;
  file?: File;
};

type MangaItem = {
  id: string;
  title: string;
};
type TranslationGroupItem = {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  description: string | null;
  _count?: {
    mangas: number;
  };
};

/* =========================================================
GENRE / TAG
========================================================= */

const genres: Genre[] = [
  { id: "boylove", name: "Boylove" },
  { id: "action", name: "Hành động" },
  { id: "romance", name: "Romance" },
  { id: "shoujo", name: "Shoujo" },
  { id: "shojo-ai", name: "Shojo Ai" },
  { id: "fantasy", name: "Fantasy" },
  { id: "drama", name: "Drama" },
  { id: "comedy", name: "Comedy" },
  { id: "school-life", name: "School Life" },
  { id: "historical", name: "Historical" },
  { id: "mystery", name: "Trinh thám" },
  { id: "horror", name: "Kinh dị" },
  { id: "psychological", name: "Tâm lý" },
  { id: "insect", name: "Insect" },
  { id: "harem", name: "Harem" },
  { id: "confinement", name: "Giam cầm" },
  { id: "18-plus", name: "18+" },
  { id: "bdsm", name: "BDSM" },
  { id: "murder", name: "Sát nhân" },
  { id: "exhibitionism", name: "Exhibitionism" },
  { id: "revenge", name: "Nhân thù" },
  { id: "tentacle", name: "Xúc tu" },
  { id: "rape", name: "Rape" },
  { id: "transmigration", name: "Xuyên không" },
  { id: "ancient", name: "Cổ trang" },
  { id: "novel", name: "Novel" },
  { id: "Supernatural", name: "Siêu nhiên" },
  { id: "Adventure", name: "Phiêu lưu" },
  { id: "Humorous", name: "Hài hước" },
  { id: "Modern", name: "Hiện đại" },
  { id: "Younger partner (in a relationship)", name: "Niên hạ" },
  { id: "Vampire", name: "Ma cà rồng" },
  { id: "Doujinshi", name: "Doujinshi" },
  { id: "Esper/Guide", name: "Esper/Guide" },
  { id: "Many authors", name: "Nhiều tác giả" },
  { id: "Dom/Sub", name: "Dom/Sub" },
  { id: "The Royal Family", name: "Hoàng gia" },
  { id: "System", name: "Hệ thống" },
  { id: "The entertainment industry", name: "Giới giải trí" },
  { id: "Marriage first, love later", name: "Cưới trước yêu sau" },
  { id: "Ancient times", name: "Thời âu cổ" },


];

/* =========================================================
SẮP XẾP TÊN ẢNH
========================================================= */

const naturalSort = (a: string, b: string) => {
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

/* =========================================================
KIỂM TRA FILE ẢNH
========================================================= */

const isImageFile = (filename: string) => {
  const lower = filename.toLowerCase();

  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif")
  );
};

/* =========================================================
ADMIN PAGE
========================================================= */

export default function AdminPage() {
  const router = useRouter();
  useEffect(() => {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const tab = params.get("tab");
  const mangaId =
    params.get("mangaId");

  if (tab === "chapter") {
    setActiveTab("chapter");
  }

  if (mangaId) {
    setSelectedManga(mangaId);
  }
}, []);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [activeTab, setActiveTab] = useState<
  "manga" | "chapter" | "group"
>("manga");

  /* =======================================================
  MANGA FORM
  ======================================================= */

  const [mangaForm, setMangaForm] = useState({
    title: "",
    originalTitle: "",
    author: "",
    translationGroupId: "",
    releaseDate: "",
    description: "",
    type: "Manga",
    status: "ongoing",
    genres: [] as string[],
    ageRestricted: false,
    cover: null as File | null,
    credit: null as File | null,
  });

  const [coverPreview, setCoverPreview] = useState("");
  const [creditPreview, setCreditPreview] = useState("");

  /* =======================================================
  CHAPTER
  ======================================================= */

  const [selectedManga, setSelectedManga] = useState("");
  const [volume, setVolume] = useState("");
  const [chapter, setChapter] = useState("");

  /* =======================================================
  ZIP + ẢNH
  ======================================================= */

  const [zipFile, setZipFile] =
    useState<File | null>(null);

  const [zipImages, setZipImages] =
    useState<ZipImage[]>([]);

  const [isProcessingZip, setIsProcessingZip] =
    useState(false);

  const [isDragging, setIsDragging] =
    useState(false);

  /* =======================================================
  MESSAGE
  ======================================================= */

  const [message, setMessage] = useState("");

  /* =======================================================
  DANH SÁCH TRUYỆN
  ======================================================= */

  const [mangaList, setMangaList] =
    useState<MangaItem[]>([]);

  const [isLoadingMangas, setIsLoadingMangas] =
    useState(false);
    const [translationGroups, setTranslationGroups] = useState<
  TranslationGroupItem[]
>([]);

const [isLoadingTranslationGroups, setIsLoadingTranslationGroups] =
  useState(false);

const [groupForm, setGroupForm] = useState({
  name: "",
  avatar: "",
  description: "",
});
const [groupAvatarFile, setGroupAvatarFile] =
  useState<File | null>(null);

const [groupAvatarPreview, setGroupAvatarPreview] =
  useState("");

const [isCreatingGroup, setIsCreatingGroup] = useState(false);
const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
const [isSavingGroup, setIsSavingGroup] = useState(false);

  /* =========================================================
  LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );

      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        error?: string;
        message?: string;
      };

      try {
        data = JSON.parse(responseText);
      } catch {
        console.error(
          "LOGOUT RESPONSE KHÔNG PHẢI JSON:",
          responseText
        );

        throw new Error(
          `Server trả về dữ liệu không hợp lệ (HTTP ${response.status}).`
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Không thể đăng xuất."
        );
      }

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );

      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Không thể đăng xuất."
      );

      setIsLoggingOut(false);
    }
  };

  /* =========================================================
  DỌN URL PREVIEW
  ========================================================= */

  useEffect(() => {
    return () => {
      zipImages.forEach((image) => {
        URL.revokeObjectURL(image.url);
      });
    };
  }, [zipImages]);

  useEffect(() => {
    return () => {
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  useEffect(() => {
    return () => {
      if (creditPreview) {
        URL.revokeObjectURL(creditPreview);
      }
    };
  }, [creditPreview]);

  /* =========================================================
  TẢI DANH SÁCH TRUYỆN
  ========================================================= */

  useEffect(() => {
    const loadMangas = async () => {
      try {
        setIsLoadingMangas(true);

        const response = await fetch(
          "/api/admin/manga",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Không thể tải danh sách truyện."
          );
        }

        const data =
          await response.json();

        if (
          !data.success ||
          !Array.isArray(data.mangas)
        ) {
          throw new Error(
            "Dữ liệu truyện không hợp lệ."
          );
        }

        setMangaList(data.mangas);

        if (
          data.mangas.length > 0
        ) {
          setSelectedManga(
            data.mangas[0].id
          );
        } else {
          setSelectedManga("");
        }
      } catch (error) {
        console.error(
          "LOAD MANGA ERROR:",
          error
        );

        setMangaList([]);
        setSelectedManga("");

        setMessage(
          "❌ Không thể tải danh sách truyện."
        );
      } finally {
        setIsLoadingMangas(false);
      }
    };

    void loadMangas();
  }, []);
  useEffect(() => {
  const loadTranslationGroups = async () => {
    try {
      setIsLoadingTranslationGroups(true);

      const response = await fetch("/api/translation-groups", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Không thể tải danh sách nhóm dịch.");
      }

      const data = await response.json();

      if (!data.success || !Array.isArray(data.groups)) {
        throw new Error("Dữ liệu nhóm dịch không hợp lệ.");
      }

      setTranslationGroups(data.groups);
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách nhóm dịch.",
      );
    } finally {
      setIsLoadingTranslationGroups(false);
    }
  };

  void loadTranslationGroups();
}, []);

  /* =========================================================
  ẢNH BÌA
  ========================================================= */

  const handleCoverChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("image/")
    ) {
      setMessage(
        "❌ Vui lòng chọn file ảnh."
      );
      return;
    }

    if (coverPreview) {
      URL.revokeObjectURL(
        coverPreview
      );
    }

    const previewUrl =
      URL.createObjectURL(file);

    setMangaForm((prev) => ({
      ...prev,
      cover: file,
    }));

    setCoverPreview(previewUrl);

    setMessage(
      `🖼️ Đã chọn ảnh bìa: ${file.name}`
    );
  };

  /* =========================================================
  ẢNH CREDIT
  ========================================================= */

  const handleCreditChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("image/")
    ) {
      setMessage(
        "❌ Vui lòng chọn file ảnh."
      );
      return;
    }

    if (creditPreview) {
      URL.revokeObjectURL(
        creditPreview
      );
    }

    const previewUrl =
      URL.createObjectURL(file);

    setMangaForm((prev) => ({
      ...prev,
      credit: file,
    }));

    setCreditPreview(
      previewUrl
    );

    setMessage(
      `🎨 Đã chọn ảnh credit/re: ${file.name}`
    );
  };

  /* =========================================================
  CHỌN TAG
  ========================================================= */

  const toggleGenre = (
    genreId: string
  ) => {
    setMangaForm((prev) => ({
      ...prev,
      genres:
        prev.genres.includes(
          genreId
        )
          ? prev.genres.filter(
              (id) =>
                id !== genreId
            )
          : [
              ...prev.genres,
              genreId,
            ],
    }));
  };

  const selectedGenreNames =
    useMemo(() => {
      return genres
        .filter((genre) =>
          mangaForm.genres.includes(
            genre.id
          )
        )
        .map(
          (genre) =>
            genre.name
        );
    }, [mangaForm.genres]);

  /* =========================================================
  XỬ LÝ ẢNH THƯỜNG
  ========================================================= */

  const processImageFiles = async (
    files: File[]
  ) => {
    const imageFiles =
      files.filter(
        (file) =>
          file.type.startsWith(
            "image/"
          ) ||
          isImageFile(file.name)
      );

    if (
      imageFiles.length === 0
    ) {
      setMessage(
        "❌ Không tìm thấy file ảnh hợp lệ."
      );
      return;
    }

    zipImages.forEach(
      (image) => {
        URL.revokeObjectURL(
          image.url
        );
      }
    );

    setZipImages([]);
    setZipFile(null);
    setIsProcessingZip(true);

    setMessage(
      `⏳ Đang chuẩn bị ${imageFiles.length} ảnh...`
    );

    try {
      const sortedFiles =
        [...imageFiles].sort(
          (a, b) =>
            naturalSort(
              a.name,
              b.name
            )
        );

      const previewImages: ZipImage[] =
        sortedFiles.map(
          (file, index) => ({
            name: file.name,
            size: file.size,
            url:
              URL.createObjectURL(
                file
              ),
            order: index + 1,
            file,
          })
        );

      setZipImages(
        previewImages
      );

      setMessage(
        `✅ Đã chọn thành công ${previewImages.length} ảnh.`
      );
    } finally {
      setIsProcessingZip(false);
    }
  };

  /* =========================================================
  XỬ LÝ ZIP
  ========================================================= */

  const processZipFile = async (
    file: File
  ) => {
    if (
      !file.name
        .toLowerCase()
        .endsWith(".zip")
    ) {
      setMessage(
        "❌ File này không phải ZIP."
      );
      return;
    }

    zipImages.forEach(
      (image) => {
        URL.revokeObjectURL(
          image.url
        );
      }
    );

    setZipImages([]);
    setZipFile(file);
    setIsProcessingZip(true);

    setMessage(
      `📦 Đang đọc và giải nén ${file.name}...`
    );

    try {
      const zip =
        await JSZip.loadAsync(
          file
        );

      const imageEntries =
        Object.values(
          zip.files
        ).filter(
          (entry) =>
            !entry.dir &&
            isImageFile(
              entry.name
            )
        );

      if (
        imageEntries.length ===
        0
      ) {
        setMessage(
          "❌ Không tìm thấy ảnh JPG, PNG hoặc WEBP bên trong ZIP."
        );

        setZipFile(null);
        return;
      }

      imageEntries.sort(
        (a, b) =>
          naturalSort(
            a.name,
            b.name
          )
      );

      const previewImages: ZipImage[] =
        [];

      for (
        let index = 0;
        index <
        imageEntries.length;
        index++
      ) {
        const entry =
          imageEntries[index];

        const blob =
          await entry.async(
            "blob"
          );

        const url =
          URL.createObjectURL(
            blob
          );

        const fileFromBlob =
          new File(
            [blob],
            entry.name
              .split("/")
              .pop() ||
              entry.name,
            {
              type:
                blob.type ||
                "image/jpeg",
            }
          );

        previewImages.push({
          name: entry.name,
          size: blob.size,
          url,
          order: index + 1,
          file: fileFromBlob,
        });
      }

      setZipImages(
        previewImages
      );

      setMessage(
        `✅ Đã giải nén thành công ${previewImages.length} ảnh.`
      );
    } catch (error) {
      console.error(
        "ZIP ERROR:",
        error
      );

      setZipImages([]);
      setZipFile(null);

      setMessage(
        "❌ Không thể đọc file ZIP. Vui lòng kiểm tra lại file."
      );
    } finally {
      setIsProcessingZip(false);
    }
  };

  /* =========================================================
  CHỌN ZIP HOẶC ẢNH
  ========================================================= */

  const handleZipChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files =
      Array.from(
        event.target.files ?? []
      );

    if (
      files.length === 0
    ) {
      return;
    }

    const zip =
      files.find(
        (file) =>
          file.name
            .toLowerCase()
            .endsWith(".zip")
      );

    if (zip) {
      void processZipFile(
        zip
      );
    } else {
      void processImageFiles(
        files
      );
    }

    event.target.value = "";
  };

  /* =========================================================
  KÉO THẢ ZIP HOẶC ẢNH
  ========================================================= */

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragging(false);

    const files =
      Array.from(
        event.dataTransfer.files ??
          []
      );

    if (
      files.length === 0
    ) {
      return;
    }

    const zip =
      files.find(
        (file) =>
          file.name
            .toLowerCase()
            .endsWith(".zip")
      );

    if (zip) {
      void processZipFile(
        zip
      );
    } else {
      void processImageFiles(
        files
      );
    }
  };

  /* =========================================================
  UPLOAD SINGLE IMAGE
  ========================================================= */

  const uploadSingleImage = async (
    file: File
  ) => {
    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    const response =
      await fetch(
        "/api/upload",
        {
          method: "POST",
          body: formData,
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.error ||
          `Không thể upload ảnh ${file.name}.`
      );
    }

    const uploadedImage =
      data.images?.[0];

    if (
      !uploadedImage?.imageUrl
    ) {
      throw new Error(
        `API không trả về URL ảnh ${file.name}.`
      );
    }

    return uploadedImage.imageUrl as string;
  };

  /* =========================================================
  TẠO TRUYỆN
  ========================================================= */

  const handleCreateManga =
    async () => {
      if (
        !mangaForm.title.trim()
      ) {
        setMessage(
          "❌ Vui lòng nhập tên truyện."
        );
        return;
      }

      if (!mangaForm.cover) {
        setMessage(
          "❌ Vui lòng tải ảnh bìa."
        );
        return;
      }

      try {
        setMessage(
          "⏳ Đang upload ảnh bìa..."
        );

        /* =====================================================
        UPLOAD ẢNH BÌA
        ===================================================== */

        const coverFormData =
          new FormData();

        coverFormData.append(
          "file",
          mangaForm.cover
        );

        coverFormData.append(
          "type",
          "cover"
        );

        const coverResponse =
          await fetch(
            "/api/upload",
            {
              method: "POST",
              body:
                coverFormData,
            }
          );

        const coverData =
          await coverResponse.json();

        if (
          !coverResponse.ok ||
          !coverData.success ||
          !coverData.imageUrl
        ) {
          throw new Error(
            coverData.error ||
              "Không thể upload ảnh bìa."
          );
        }

        const coverUrl =
          coverData.imageUrl;

        /* =====================================================
        UPLOAD ẢNH CREDIT
        - Không bắt buộc
        ===================================================== */

        let creditUrl:
          string | null = null;

        if (mangaForm.credit) {
          setMessage(
            "⏳ Đang upload ảnh credit..."
          );

          const creditFormData =
            new FormData();

          creditFormData.append(
            "file",
            mangaForm.credit
          );

          creditFormData.append(
            "type",
            "credit"
          );

          const creditResponse =
            await fetch(
              "/api/upload",
              {
                method: "POST",
                body:
                  creditFormData,
              }
            );

          const creditData =
            await creditResponse.json();

          if (
            !creditResponse.ok ||
            !creditData.success ||
            !creditData.imageUrl
          ) {
            throw new Error(
              creditData.error ||
                "Không thể upload ảnh credit."
            );
          }

          creditUrl =
            creditData.imageUrl;
        }

        /* =====================================================
        TẠO TRUYỆN TRONG DATABASE
        ===================================================== */

        setMessage(
          "⏳ Đang tạo truyện..."
        );

        const response =
          await fetch(
            "/api/admin/manga",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                title:
                  mangaForm.title.trim(),

                originalTitle:
                  mangaForm.originalTitle.trim(),

                   author:
    mangaForm.author.trim(),
    translationGroupId:
  mangaForm.translationGroupId || null,

    releaseDate:
  mangaForm.releaseDate || null,

                description:
                  mangaForm.description.trim(),

                type:
                  mangaForm.type,

                status:
                  mangaForm.status,

                genres:
                  mangaForm.genres,

                ageRestricted:
                  mangaForm.ageRestricted,

                coverUrl,

                creditUrl,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Không thể tạo truyện."
          );
        }

        /* =====================================================
        THÀNH CÔNG
        ===================================================== */

        setMessage(
          `✅ Tạo truyện thành công: "${data.manga.title}"`
        );

        if (
          data.manga?.id &&
          data.manga?.title
        ) {
          const newManga:
            MangaItem = {
            id:
              data.manga.id,
            title:
              data.manga.title,
          };

          setMangaList(
            (prev) => [
              newManga,
              ...prev.filter(
                (item) =>
                  item.id !==
                  newManga.id
              ),
            ]
          );

          setSelectedManga(
            newManga.id
          );
          router.push(`/admin/manga/${data.manga.id}`);
router.refresh();
        }

        /* =====================================================
        RESET FORM ẢNH
        ===================================================== */

        if (coverPreview) {
          URL.revokeObjectURL(
            coverPreview
          );
        }

        if (creditPreview) {
          URL.revokeObjectURL(
            creditPreview
          );
        }

        setCoverPreview("");
        setCreditPreview("");

        setMangaForm({
          title: "",
          originalTitle: "",
          author: "",
          translationGroupId: "",
          releaseDate: "",
          description: "",
          type: "Manga",
          status: "ongoing",
          genres: [],
          ageRestricted: false,
          cover: null,
          credit: null,
        });
      } catch (error) {
        console.error(
          "CREATE MANGA ERROR:",
          error
        );

        setMessage(
          error instanceof Error
            ? `❌ ${error.message}`
            : "❌ Không thể tạo truyện."
        );
      }
    };

  /* =========================================================
  UPLOAD CHAPTER
  ========================================================= */

  const handleGroupAvatarChange = (
  event: ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setMessage("❌ Vui lòng chọn file ảnh.");
    return;
  }

  if (groupAvatarPreview) {
    URL.revokeObjectURL(groupAvatarPreview);
  }

  const previewUrl = URL.createObjectURL(file);

  setGroupAvatarFile(file);
  setGroupAvatarPreview(previewUrl);

  // Nếu chọn file thì bỏ URL cũ
  setGroupForm((current) => ({
    ...current,
    avatar: "",
  }));

  setMessage(` Đã chọn avatar: ${file.name}`);

  event.target.value = "";
};
  const handleCreateTranslationGroup = async () => {
  try {
    setMessage("");

    const name = groupForm.name.trim();
const avatarUrl = groupForm.avatar.trim();
const description = groupForm.description.trim();

    if (!name) {
      setMessage("Vui lòng nhập tên nhóm dịch.");
      return;
    }

    setIsCreatingGroup(true);
    let finalAvatarUrl =
  avatarUrl || null;

if (groupAvatarFile) {
  setMessage("⏳ Đang upload avatar nhóm...");

  const formData = new FormData();

  formData.append(
    "file",
    groupAvatarFile
  );

  formData.append(
    "type",
    "avatar"
  );

  const uploadResponse =
    await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

  const uploadData =
    await uploadResponse.json();

  if (
    !uploadResponse.ok ||
    !uploadData.success
  ) {
    throw new Error(
      uploadData.error ||
        "Không thể upload avatar nhóm."
    );
  }

  finalAvatarUrl =
    uploadData.imageUrl ||
    uploadData.images?.[0]?.imageUrl ||
    null;

  if (!finalAvatarUrl) {
    throw new Error(
      "API không trả về URL avatar."
    );
  }
}

    const response = await fetch("/api/translation-groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  name,
  avatar: finalAvatarUrl,
  description: description || null,
}),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Không thể tạo nhóm dịch.",
      );
    }

    setTranslationGroups((current) => [
      data.group,
      ...current,
    ]);

    setGroupForm({
      name: "",
      avatar: "",
      description: "",
    });
    if (groupAvatarPreview) {
  URL.revokeObjectURL(groupAvatarPreview);
}

setGroupAvatarFile(null);
setGroupAvatarPreview("");

    setMessage("Đã tạo nhóm dịch thành công.");
  } catch (error) {
    console.error(error);

    setMessage(
      error instanceof Error
        ? error.message
        : "Không thể tạo nhóm dịch.",
    );
  } finally {
    setIsCreatingGroup(false);
  }
};
const handleDeleteTranslationGroup = async (
  groupId: string
) => {
  const confirmed = window.confirm(
    "Bạn có chắc muốn xóa nhóm dịch này không?"
  );

  if (!confirmed) return;

  try {
    setMessage("");

    const response = await fetch(
      "/api/translation-groups",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: groupId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Không thể xóa nhóm dịch."
      );
    }

    setTranslationGroups((current) =>
      current.filter(
        (group) => group.id !== groupId
      )
    );

    setMessage("Đã xóa nhóm dịch thành công.");
  } catch (error) {
    console.error(error);

    setMessage(
      error instanceof Error
        ? error.message
        : "Không thể xóa nhóm dịch."
    );
  }
};
const handleEditTranslationGroup = async () => {
  if (!editingGroupId) return;

  try {
    setMessage("");

    const name = groupForm.name.trim();
    const avatar = groupForm.avatar.trim();
    const description = groupForm.description.trim();

    if (!name) {
      setMessage("Vui lòng nhập tên nhóm dịch.");
      return;
    }

    setIsSavingGroup(true);

    const response = await fetch("/api/translation-groups", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: editingGroupId,
        name,
        avatar: avatar || null,
        description: description || null,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Không thể sửa nhóm dịch."
      );
    }

    setTranslationGroups((current) =>
      current.map((group) =>
        group.id === editingGroupId
          ? data.group
          : group
      )
    );

    setEditingGroupId(null);

    setGroupForm({
      name: "",
      avatar: "",
      description: "",
    });

    setMessage("Đã cập nhật nhóm dịch thành công.");
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Không thể sửa nhóm dịch."
    );
  } finally {
    setIsSavingGroup(false);
  }
};
const startEditTranslationGroup = (
  group: TranslationGroupItem
) => {
  setEditingGroupId(group.id);

  setGroupForm({
    name: group.name,
    avatar: group.avatar || "",
    description: group.description || "",
  });

  setMessage("");
};
const cancelEditTranslationGroup = () => {
  setEditingGroupId(null);

  setGroupForm({
    name: "",
    avatar: "",
    description: "",
  });

  setMessage("");
};
  const handleUploadChapter =
    async () => {
      if (!selectedManga) {
        setMessage(
          "❌ Vui lòng chọn truyện."
        );
        return;
      }

      if (!chapter.trim()) {
        setMessage(
          "❌ Vui lòng nhập số chapter."
        );
        return;
      }

      const chapterNumber =
        Number(chapter);

      if (
        !Number.isFinite(
          chapterNumber
        ) ||
        chapterNumber < 0
      ) {
        setMessage(
          "❌ Số chapter không hợp lệ."
        );
        return;
      }

      if (
        !Number.isInteger(
          chapterNumber
        )
      ) {
        setMessage(
          "❌ Số chapter phải là số nguyên."
        );
        return;
      }

      let volumeNumber:
        number | null = null;

      if (volume.trim()) {
        volumeNumber =
          Number(volume);

        if (
          !Number.isFinite(
            volumeNumber
          ) ||
          volumeNumber < 1
        ) {
          setMessage(
            "❌ Volume không hợp lệ."
          );
          return;
        }

        if (
          !Number.isInteger(
            volumeNumber
          )
        ) {
          setMessage(
            "❌ Volume phải là số nguyên."
          );
          return;
        }
      }

      if (
        zipImages.length === 0
      ) {
        setMessage(
          "❌ Chưa có ảnh để upload."
        );
        return;
      }

      const selectedMangaData =
        mangaList.find(
          (manga) =>
            manga.id ===
            selectedManga
        );

      if (!selectedMangaData) {
        setMessage(
          "❌ Không tìm thấy truyện đã chọn."
        );
        return;
      }

      try {
        setMessage(
          `⏳ Đang upload ${zipImages.length} ảnh...`
        );

        const uploadedImages: {
          imageUrl: string;
          fileName: string;
          order: number;
        }[] = [];

        /*
          Upload từng ảnh theo đúng thứ tự preview.

          Hỗ trợ:
          - ZIP đã giải nén
          - nhiều ảnh chọn trực tiếp
        */

        for (
          let index = 0;
          index <
          zipImages.length;
          index++
        ) {
          const image =
            zipImages[index];

          setMessage(
            `⏳ Đang upload ảnh ${index + 1}/${zipImages.length}...`
          );

          let file: File;

          if (image.file) {
            file =
              image.file;
          } else {
            const imageResponse =
              await fetch(
                image.url
              );

            if (
              !imageResponse.ok
            ) {
              throw new Error(
                `Không thể đọc ảnh ${image.name}.`
              );
            }

            const blob =
              await imageResponse.blob();

            file =
              new File(
                [blob],
                image.name
                  .split("/")
                  .pop() ||
                  image.name,
                {
                  type:
                    blob.type ||
                    "image/jpeg",
                }
              );
          }

          const formData =
            new FormData();

          formData.append(
            "file",
            file
          );

          const uploadResponse =
            await fetch(
              "/api/upload",
              {
                method:
                  "POST",
                body:
                  formData,
              }
            );

          const uploadData =
            await uploadResponse.json();

          if (
            !uploadResponse.ok ||
            !uploadData.success
          ) {
            throw new Error(
              uploadData.error ||
                `Không thể upload ảnh ${image.name}.`
            );
          }

          const uploadedImage =
            uploadData.images?.[0];

          if (
            !uploadedImage?.imageUrl
          ) {
            throw new Error(
              `API không trả về ảnh sau khi upload ${file.name}.`
            );
          }

          uploadedImages.push({
            imageUrl:
              uploadedImage.imageUrl,

            fileName:
              uploadedImage.fileName ||
              file.name,

            order:
              index + 1,
          });
        }

        /* =====================================================
        ĐẢM BẢO THỨ TỰ ẢNH
        ===================================================== */

        uploadedImages.sort(
          (a, b) =>
            a.order - b.order
        );

        setMessage(
          "⏳ Đang tạo chapter trong database..."
        );

        /* =====================================================
        TẠO CHAPTER
        ===================================================== */

        const response =
          await fetch(
            "/api/admin/chapter",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  mangaId:
                    selectedManga,

                  volume:
                    volumeNumber,

                  chapter:
                    chapterNumber,

                  images:
                    uploadedImages,
                }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Không thể tạo chapter."
          );
        }

        /* =====================================================
        THÀNH CÔNG
        ===================================================== */

        setMessage(
          `✅ Upload thành công Chapter ${chapterNumber} của "${selectedMangaData.title}" — ${uploadedImages.length} ảnh.`
        );

        setVolume("");
        setChapter("");
        setZipFile(null);

        /* =====================================================
        XÓA PREVIEW CŨ
        ===================================================== */

        zipImages.forEach(
          (image) => {
            URL.revokeObjectURL(
              image.url
            );
          }
        );

        setZipImages([]);
      } catch (error) {
        console.error(
          "UPLOAD CHAPTER ERROR:",
          error
        );

        setMessage(
          error instanceof Error
            ? `❌ ${error.message}`
            : "❌ Không thể upload chapter."
        );
      }
    };

  /* =========================================================
  RETURN
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#09060d] text-white">

      {/* =====================================================
      HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#4b176d] via-[#8e278f] to-[#d13b91] shadow-lg">

        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-6">

          <div className="flex items-center gap-3">

            <img
              src="/logo.png"
              alt="Yoru Translation Group"
              className="h-14 w-auto object-contain"
            />

            <div>

              <h1 className="text-xl font-extrabold text-white">
                Yoru Translation Group
              </h1>

              <p className="text-xs text-purple-200">
                Admin Dashboard
              </p>

            </div>

          </div>

          <div className="flex items-center gap-3">

            <a
              href="/"
              className="rounded-xl bg-white/20 px-4 py-2 font-semibold text-white transition hover:bg-white/30"
            >
              ← Trang chủ
            </a>

            <button
              type="button"
              onClick={() =>
                void handleLogout()
              }
              disabled={
                isLoggingOut
              }
              className="rounded-xl bg-red-500/80 px-4 py-2 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoggingOut
                ? "⏳ Đang đăng xuất..."
                : "🚪 Đăng xuất"}
            </button>

          </div>

        </div>

      </header>

      {/* =====================================================
      MAIN
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-10">

        <div className="mb-8">

          <h2 className="text-4xl font-extrabold text-pink-200">
            👑 Quản trị Yoru
          </h2>

          <p className="mt-2 text-purple-300">
            Quản lý truyện và chapter của Yoru Translation Group.
          </p>

        </div>

        {/* ===================================================
        MENU
        =================================================== */}

        <div className="mb-8 flex flex-wrap gap-3">

          <button
            type="button"
            onClick={() =>
              setActiveTab("manga")
            }
            className={
              activeTab === "manga"
                ? "rounded-xl bg-gradient-to-r from-[#75257f] to-[#d13b91] px-6 py-3 font-bold text-white shadow-lg"
                : "rounded-xl border border-purple-800 bg-[#18101f] px-6 py-3 font-bold text-pink-200 shadow-sm hover:bg-[#24152f]"
            }
          >
            📚 Thêm truyện
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("chapter")
            }
            className={
              activeTab === "chapter"
                ? "rounded-xl bg-gradient-to-r from-[#75257f] to-[#d13b91] px-6 py-3 font-bold text-white shadow-lg"
                : "rounded-xl border border-purple-800 bg-[#18101f] px-6 py-3 font-bold text-pink-200 shadow-sm hover:bg-[#24152f]"
            }
          >
            📖 Upload chapter
          </button>
          <button
  type="button"
  onClick={() => setActiveTab("group")}
  className={
    activeTab === "group"
      ? "rounded-xl bg-gradient-to-r from-[#75257f] to-[#d13b91] px-6 py-3 font-bold text-white shadow-lg"
      : "rounded-xl border border-purple-800 bg-[#18101f] px-6 py-3 font-bold text-pink-200 shadow-sm hover:bg-[#24152f]"
  }
>
   Quản lý nhóm dịch
</button>

        </div>

        {/* ===================================================
        MESSAGE
        =================================================== */}

        {message && (
          <div className="mb-6 rounded-2xl border border-purple-800 bg-[#18101f] p-4 font-semibold text-pink-200 shadow-sm">
            {message}
          </div>
        )}

        {/* ===================================================
        THÊM TRUYỆN
        =================================================== */}

        {activeTab === "manga" && (

          <div className="rounded-3xl border border-purple-800 bg-[#0f0a14] p-8 shadow-lg">

            <div className="mb-8">

              <h3 className="text-2xl font-extrabold text-purple-200">
                ➕ Tạo truyện mới
              </h3>

              <p className="mt-2 text-sm text-purple-400">
                Nhập thông tin cơ bản của bộ truyện.
              </p>

            </div>

            {/* ẢNH BÌA */}

            <div className="mb-8">

              <label className="mb-3 block font-bold text-purple-200">
                🖼️ Ảnh bìa
              </label>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">

                <label className="group relative flex min-h-[520px] w-full max-w-[360px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-purple-700 bg-[#18101f] transition hover:border-pink-400 hover:bg-[#24152f]">

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={
                      handleCoverChange
                    }
                  />

                  {coverPreview ? (

                    <img
                      src={
                        coverPreview
                      }
                      alt="Preview ảnh bìa"
                      className="h-full w-full object-contain"
                    />

                  ) : (

                    <div className="px-4 text-center">

                      <div className="text-4xl">
                        🖼️
                      </div>

                      <p className="mt-3 text-sm font-semibold text-purple-300">
                        Tải ảnh bìa
                      </p>

                    </div>

                  )}

                </label>

                <div className="text-sm text-purple-400">

                  <p>
                    Chọn ảnh bìa cho truyện.
                  </p>

                  <p className="mt-2">
                    JPG, PNG hoặc WEBP.
                  </p>

                </div>

              </div>

            </div>

            {/* TÊN TRUYỆN */}

            <div className="mb-5">

              <label className="mb-2 block font-bold text-purple-200">
                Tên truyện
              </label>

              <input
                value={
                  mangaForm.title
                }
                onChange={(
                  event
                ) =>
                  setMangaForm(
                    (prev) => ({
                      ...prev,
                      title:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="Ví dụ: Jinx"
                className="w-full rounded-xl border border-purple-800 bg-[#18101f] px-4 py-3 text-white placeholder:text-purple-500 outline-none focus:ring-2 focus:ring-pink-400"
              />

            </div>

            {/* TÊN GỐC */}

            <div className="mb-5">

              <label className="mb-2 block font-bold text-purple-200">
                Tên gốc
              </label>

              <input
                value={
                  mangaForm.originalTitle
                }
                onChange={(
                  event
                ) =>
                  setMangaForm(
                    (prev) => ({
                      ...prev,
                      originalTitle:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="Tên gốc của truyện"
                className="w-full rounded-xl border border-purple-800 bg-[#18101f] px-4 py-3 text-white placeholder:text-purple-500 outline-none focus:ring-2 focus:ring-pink-400"
              />

            </div>

            {/* TÁC GIẢ */}

            <div className="mb-5">

              <label className="mb-2 block font-bold text-purple-200">
                 Tác giả
              </label>

              <input
                value={mangaForm.author}
                onChange={(event) =>
                  setMangaForm((prev) => ({
                    ...prev,
                    author: event.target.value,
                  }))
                }
                placeholder="Ví dụ: Mingwa"
                className="w-full rounded-xl border border-purple-800 bg-[#18101f] px-4 py-3 text-white placeholder:text-purple-500 outline-none focus:ring-2 focus:ring-pink-400"
              />

            </div>

            {/* NGÀY PHÁT HÀNH */}
<div className="mb-5">

  <label className="mb-2 block font-bold text-purple-200">
     Ngày phát hành
  </label>

  <input
    type="date"
    value={mangaForm.releaseDate}
    onChange={(event) =>
      setMangaForm((prev) => ({
        ...prev,
        releaseDate: event.target.value,
      }))
    }
    className="w-full rounded-xl border border-purple-800 bg-[#18101f] px-4 py-3 text-white outline-none focus:ring-2 focus:ring-pink-400"
  />

</div>
{/* NHÓM DỊCH */}
<div className="mb-5">

  <label className="mb-2 block font-bold text-purple-200">
     Nhóm dịch
  </label>

  <select
    value={mangaForm.translationGroupId}
    onChange={(event) =>
      setMangaForm((prev) => ({
        ...prev,
        translationGroupId: event.target.value,
      }))
    }
    disabled={isLoadingTranslationGroups}
    className="w-full rounded-xl border border-purple-800 bg-[#18101f] px-4 py-3 text-white outline-none focus:ring-2 focus:ring-pink-400 disabled:bg-[#0d0a11]"
  >

    <option value="">
      {isLoadingTranslationGroups
        ? " Đang tải nhóm dịch..."
        : "Không thuộc nhóm dịch"}
    </option>

    {translationGroups.map((group) => (
      <option
        key={group.id}
        value={group.id}
      >
        {group.name}
      </option>
    ))}

  </select>

  {!isLoadingTranslationGroups &&
    translationGroups.length === 0 && (
      <p className="mt-2 text-xs text-purple-500">
        Chưa có nhóm dịch nào. Hãy tạo nhóm ở mục "Quản lý nhóm dịch".
      </p>
    )}

</div>
            {/* MÔ TẢ */}

            <div className="mb-5">

              <label className="mb-2 block font-bold text-purple-200">
                Mô tả truyện
              </label>

              <textarea
                value={
                  mangaForm.description
                }
                onChange={(
                  event
                ) =>
                  setMangaForm(
                    (prev) => ({
                      ...prev,
                      description:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="Nhập mô tả của truyện..."
                rows={6}
                className="w-full resize-y rounded-xl border border-purple-800 bg-[#18101f] px-4 py-3 text-white placeholder:text-purple-500 outline-none focus:ring-2 focus:ring-pink-400"
              />

            </div>

            {/* LOẠI TRUYỆN */}

            <div className="mb-7">

              <label className="mb-3 block font-bold text-purple-200">
                📚 Loại truyện
              </label>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                {[
                  "Manga",
                  "Manhwa",
                  "Manhua",
                  "Novel",
                ].map(
                  (type) => (

                    <button
                      type="button"
                      key={type}
                      onClick={() =>
                        setMangaForm(
                          (prev) => ({
                            ...prev,
                            type,
                          })
                        )
                      }
                      className={
                        mangaForm.type ===
                        type
                          ? "rounded-xl bg-purple-700 px-5 py-3 font-bold text-white"
                          : "rounded-xl border border-purple-800 bg-[#18101f] px-5 py-3 font-semibold text-purple-300 hover:bg-[#24152f]"
                      }
                    >
                      {type}
                    </button>

                  )
                )}

              </div>

            </div>

            {/* TRẠNG THÁI */}

            <div className="mb-7">

              <label className="mb-3 block font-bold text-purple-200">
                📌 Trạng thái truyện
              </label>

              <div className="grid gap-3 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={() =>
                    setMangaForm(
                      (prev) => ({
                        ...prev,
                        status:
                          "ongoing",
                      })
                    )
                  }
                  className={
                    mangaForm.status ===
                    "ongoing"
                      ? "rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-5 py-3 font-bold text-white"
                      : "rounded-xl border border-purple-800 bg-[#18101f] px-5 py-3 font-semibold text-purple-300 hover:bg-[#24152f]"
                  }
                >
                  🔄 Đang tiến hành
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMangaForm(
                      (prev) => ({
                        ...prev,
                        status:
                          "completed",
                      })
                    )
                  }
                  className={
                    mangaForm.status ===
                    "completed"
                      ? "rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-5 py-3 font-bold text-white"
                      : "rounded-xl border border-purple-800 bg-[#18101f] px-5 py-3 font-semibold text-purple-300 hover:bg-[#24152f]"
                  }
                >
                  ✅ Đã hoàn thành
                </button>

              </div>

            </div>

            {/* TAG */}

            <div className="mb-7">

              <label className="mb-3 block font-bold text-purple-200">
                🏷️ Thể loại / Tag
              </label>

              <div className="flex flex-wrap gap-3">

                {genres.map(
                  (genre) => (

                    <button
                      type="button"
                      key={
                        genre.id
                      }
                      onClick={() =>
                        toggleGenre(
                          genre.id
                        )
                      }
                      className={
                        mangaForm.genres.includes(
                          genre.id
                        )
                          ? "rounded-full bg-gradient-to-r from-purple-700 to-pink-600 px-4 py-2 text-sm font-bold text-white"
                          : "rounded-full border border-purple-800 bg-[#18101f] px-4 py-2 text-sm font-semibold text-purple-300 hover:bg-[#24152f]"
                      }
                    >
                      {
                        genre.name
                      }
                    </button>

                  )
                )}

              </div>

              {selectedGenreNames.length >
                0 && (

                <p className="mt-4 text-sm text-purple-400">

                  Đã chọn:{" "}

                  <strong className="text-purple-200">
                    {selectedGenreNames.join(
                      ", "
                    )}
                  </strong>

                </p>

              )}

            </div>

            {/* 18+ */}

            <div className="mb-8 rounded-2xl border border-red-900 bg-[#1d0b10] p-5">

              <label className="flex cursor-pointer items-start gap-3">

                <input
                  type="checkbox"
                  checked={
                    mangaForm.ageRestricted
                  }
                  onChange={(
                    event
                  ) =>
                    setMangaForm(
                      (prev) => ({
                        ...prev,
                        ageRestricted:
                          event
                            .target
                            .checked,
                      })
                    )
                  }
                  className="mt-1 h-5 w-5 accent-purple-700"
                />

                <div>

                  <p className="font-bold text-red-400">
                    🔞 Nội dung giới hạn độ tuổi
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-300">
                    Truyện được đánh dấu
                    sẽ thuộc khu vực nội
                    dung giới hạn độ tuổi
                    và chỉ hiển thị sau khi
                    người đọc xác nhận phù
                    hợp độ tuổi.
                  </p>

                </div>

              </label>

            </div>

            {/* CREDIT */}

            <div className="mb-8">

              <label className="mb-3 block font-bold text-purple-200">
                🎨 Ảnh credit / re của nhóm
              </label>

              <p className="mb-4 text-sm text-purple-400">
                Ảnh này sẽ được tự động
                thêm vào cuối chapter.
              </p>

              <label className="flex min-h-40 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-purple-700 bg-[#18101f] transition hover:border-pink-400 hover:bg-[#24152f]">

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={
                    handleCreditChange
                  }
                />

                {creditPreview ? (

                  <img
                    src={
                      creditPreview
                    }
                    alt="Preview credit"
                    className="max-h-72 w-full object-contain"
                  />

                ) : (

                  <div className="text-center">

                    <div className="text-4xl">
                      🎨
                    </div>

                    <p className="mt-3 font-semibold text-purple-300">
                      Tải ảnh credit / re
                    </p>

                  </div>

                )}

              </label>

            </div>

            {/* CREATE */}

            <button
              type="button"
              onClick={
                handleCreateManga
              }
              className="w-full rounded-xl bg-gradient-to-r from-[#75257f] to-[#d13b91] px-6 py-4 font-bold text-white shadow-lg transition hover:scale-[1.01] hover:shadow-xl"
            >
              ➕ Tạo truyện
            </button>

          </div>

        )}

        {/* ===================================================
        UPLOAD CHAPTER
        =================================================== */}

        {activeTab === "chapter" && (

          <div className="rounded-3xl border border-purple-800 bg-[#0f0a14] p-8 shadow-lg">

            <div className="mb-8">

              <h3 className="text-2xl font-extrabold text-purple-200">
                📖 Upload chapter
              </h3>

              <p className="mt-2 text-sm text-purple-400">
                Bạn có thể upload bằng file ZIP hoặc chọn nhiều ảnh trực tiếp.
              </p>

            </div>

            {/* TRUYỆN */}

            <div className="mb-5">

              <label className="mb-2 block font-bold text-purple-200">
                📚 Chọn truyện
              </label>

              <select
                value={
                  selectedManga
                }
                onChange={(
                  event
                ) =>
                  setSelectedManga(
                    event.target
                      .value
                  )
                }
                disabled={
                  isLoadingMangas
                }
                className="w-full rounded-xl border border-purple-800 bg-[#18101f] px-4 py-3 text-white outline-none focus:ring-2 focus:ring-pink-400 disabled:bg-[#0d0a11]"
              >

                {isLoadingMangas ? (

                  <option value="">
                    ⏳ Đang tải danh sách truyện...
                  </option>

                ) : mangaList.length ===
                  0 ? (

                  <option value="">
                    ❌ Không tìm thấy truyện
                  </option>

                ) : (

                  mangaList.map(
                    (manga) => (

                      <option
                        key={
                          manga.id
                        }
                        value={
                          manga.id
                        }
                      >
                        {
                          manga.title
                        }
                      </option>

                    )
                  )

                )}

              </select>

              {!isLoadingMangas &&
                mangaList.length >
                  0 && (

                <p className="mt-2 text-xs text-purple-500">

                  Đang có{" "}

                  <strong className="text-purple-300">
                    {
                      mangaList.length
                    }
                  </strong>{" "}
                  truyện trong database.

                </p>

              )}

            </div>

            {/* VOLUME */}

            <div className="mb-5">

              <label className="mb-2 block font-bold text-purple-200">

                📕 Volume

                <span className="ml-2 text-sm font-normal text-purple-500">
                  (không bắt buộc)
                </span>

              </label>

              <input
                value={volume}
                onChange={(
                  event
                ) =>
                  setVolume(
                    event.target
                      .value
                  )
                }
                type="number"
                min="1"
                placeholder="Để trống nếu không dùng Volume"
                className="w-full rounded-xl border border-purple-800 bg-[#18101f] px-4 py-3 text-white placeholder:text-purple-500 outline-none focus:ring-2 focus:ring-pink-400"
              />

            </div>

            {/* CHAPTER */}

            <div className="mb-5">

              <label className="mb-2 block font-bold text-purple-200">
                📖 Số chapter
              </label>

              <input
                value={chapter}
                onChange={(
                  event
                ) =>
                  setChapter(
                    event.target
                      .value
                  )
                }
                type="number"
                min="0"
                placeholder="Ví dụ: 8"
                className="w-full rounded-xl border border-purple-800 bg-[#18101f] px-4 py-3 text-white placeholder:text-purple-500 outline-none focus:ring-2 focus:ring-pink-400"
              />

            </div>

            {/* ZIP / ẢNH DROPZONE */}

            <div className="mb-6">

              <label className="mb-3 block font-bold text-purple-200">
                📦 File ZIP hoặc ảnh chapter
              </label>

              <div
                onDragOver={
                  handleDragOver
                }
                onDragLeave={
                  handleDragLeave
                }
                onDrop={
                  handleDrop
                }
                className={
                  isDragging
                    ? "rounded-2xl border-2 border-dashed border-pink-500 bg-[#3a1238] px-6 py-14 text-center transition"
                    : "rounded-2xl border-2 border-dashed border-purple-800 bg-[#18101f] px-6 py-14 text-center transition hover:border-pink-400 hover:bg-[#24152f]"
                }
              >

                <label className="block cursor-pointer">

                  <input
                    type="file"
                    accept=".zip,application/zip,image/*"
                    multiple
                    className="hidden"
                    onChange={
                      handleZipChange
                    }
                  />

                  <div className="text-5xl">
                    📦
                  </div>

                  <p className="mt-4 text-lg font-bold text-purple-200">

                    {isDragging
                      ? "Thả file ZIP hoặc ảnh vào đây"
                      : "Kéo ZIP hoặc ảnh vào đây"}

                  </p>

                  <p className="mt-2 text-sm text-purple-400">
                    hoặc bấm vào đây để chọn ZIP hoặc nhiều ảnh
                  </p>

                  <p className="mt-4 text-xs text-purple-500">
                    ZIP sẽ tự động giải nén; ảnh thường sẽ được sắp xếp theo tên file.
                  </p>

                </label>

              </div>

            </div>

            {/* ĐANG XỬ LÝ */}

            {isProcessingZip && (

              <div className="mb-6 rounded-2xl border border-purple-800 bg-[#18101f] p-5">

                <div className="flex items-center gap-3">

                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-700 border-t-pink-500" />

                  <div>

                    <p className="font-bold text-purple-200">
                      📦 Đang xử lý file...
                    </p>

                    <p className="mt-1 text-sm text-purple-400">
                      Đang đọc ảnh và sắp xếp thứ tự.
                    </p>

                  </div>

                </div>

              </div>

            )}

            {/* FILE ĐÃ CHỌN */}

            {zipFile &&
              !isProcessingZip && (

              <div className="mb-6 rounded-2xl border border-pink-900 bg-[#24101f] p-5">

                <p className="text-sm font-bold text-purple-200">
                  📦 File ZIP đã chọn
                </p>

                <p className="mt-2 break-all text-sm text-pink-400">
                  {
                    zipFile.name
                  }
                </p>

                <p className="mt-1 text-xs text-purple-500">

                  Dung lượng:{" "}

                  {(
                    zipFile.size /
                    1024 /
                    1024
                  ).toFixed(
                    2
                  )}{" "}
                  MB

                </p>

              </div>

            )}

            {/* PREVIEW */}

            <div className="mb-6 rounded-2xl border border-purple-800 bg-[#18101f] p-6">

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h4 className="font-bold text-purple-200">
                    🖼️ Xem trước ảnh chapter
                  </h4>

                  <p className="mt-1 text-sm text-purple-400">
                    Ảnh được sắp xếp theo thứ tự tên file (1 → 2 → 3...).
                  </p>

                </div>

                {zipImages.length >
                  0 && (

                  <div className="rounded-full bg-[#24152f] px-4 py-2 text-sm font-bold text-purple-200 shadow-sm">

                    {
                      zipImages.length
                    }{" "}
                    ảnh

                  </div>

                )}

              </div>

              {zipImages.length ===
                0 &&
                !isProcessingZip && (

                <div className="mt-5 rounded-2xl bg-[#0f0a14] p-8 text-center">

                  <div className="text-5xl">
                    🖼️
                  </div>

                  <p className="mt-4 font-bold text-purple-200">
                    Chưa có ảnh preview
                  </p>

                  <p className="mt-2 text-sm text-purple-400">
                    Hãy chọn hoặc kéo một file ZIP
                    hoặc nhiều ảnh vào khu vực phía trên.
                  </p>

                </div>

              )}

              {zipImages.length >
                0 && (

                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">

                  {zipImages.map(
                    (image) => (

                      <div
                        key={`${image.name}-${image.order}`}
                        className="overflow-hidden rounded-2xl border border-purple-800 bg-[#0f0a14] shadow-sm"
                      >

                        <div className="flex items-center justify-between border-b border-purple-800 px-3 py-2">

                          <span className="rounded-full bg-purple-700 px-2.5 py-1 text-xs font-bold text-white">
                            {
                              image.order
                            }
                          </span>

                          <span className="text-xs text-purple-500">

                            {(
                              image.size /
                              1024
                            ).toFixed(
                              0
                            )}{" "}
                            KB

                          </span>

                        </div>

                        <div className="aspect-[2/3] bg-[#08060b]">

                          <img
                            src={
                              image.url
                            }
                            alt={`Ảnh ${image.order}`}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />

                        </div>

                        <div className="border-t border-purple-800 p-3">

                          <p
                            className="truncate text-xs font-semibold text-purple-300"
                            title={
                              image.name
                            }
                          >
                            {
                              image.name
                            }
                          </p>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

            {/* THÔNG TIN THỨ TỰ */}

            {zipImages.length >
              0 && (

              <div className="mb-6 rounded-2xl border border-green-900 bg-[#0b1a12] p-5">

                <p className="font-bold text-green-400">
                  ✅ Đã sắp xếp ảnh thành công
                </p>

                <p className="mt-2 text-sm leading-6 text-green-300">

                  Hệ thống sẽ xử lý ảnh theo thứ tự
                  hiển thị bên trên:

                  <strong>
                    {" "}
                    1 → 2 → 3 → 4 → 5 → ...
                  </strong>

                </p>

                <p className="mt-2 text-xs text-green-500">
                  Bạn có thể kiểm tra toàn bộ ảnh trước
                  khi bấm Upload Chapter.
                </p>

              </div>

            )}

            {/* TÊN CHAPTER */}

            {chapter && (

              <div className="mb-6 rounded-2xl border border-purple-800 bg-[#18101f] p-5">

                <p className="text-sm font-bold text-purple-300">
                  👀 Tên chapter sẽ hiển thị
                </p>

                <p className="mt-2 text-lg font-extrabold text-pink-400">

                  {volume
                    ? `Vol. ${volume} — Chapter ${chapter}`
                    : `Chapter ${chapter}`}

                </p>

              </div>

            )}

            {/* CREDIT */}

            <div className="mb-6 rounded-2xl border border-fuchsia-900 bg-[#21101f] p-5">

              <p className="font-bold text-purple-200">
                🎨 Credit / re cuối chapter
              </p>

              <p className="mt-2 text-sm leading-6 text-purple-400">
                Nếu bộ truyện đã có ảnh credit/re,
                hệ thống sẽ đưa ảnh đó xuống cuối
                chapter sau toàn bộ ảnh truyện.
              </p>

            </div>

            {/* UPLOAD */}

            <button
              type="button"
              disabled={
                isProcessingZip ||
                zipImages.length ===
                  0
              }
              onClick={
                handleUploadChapter
              }
              className={
                isProcessingZip ||
                zipImages.length ===
                  0
                  ? "w-full cursor-not-allowed rounded-xl bg-[#2a2630] px-6 py-4 font-bold text-gray-500"
                  : "w-full rounded-xl bg-gradient-to-r from-[#75257f] to-[#d13b91] px-6 py-4 font-bold text-white shadow-lg transition hover:scale-[1.01] hover:shadow-xl"
              }
            >

              {isProcessingZip
                ? "⏳ Đang xử lý file..."
                : zipImages.length ===
                    0
                  ? "📦 Chưa có ảnh để Upload"
                  : `⬆️ Upload Chapter — ${zipImages.length} ảnh`}

            </button>

          </div>

        )}
                {activeTab === "group" && (
          <div className="rounded-3xl border border-purple-800 bg-[#0f0a14] p-8 shadow-lg">
            <div className="mb-8">
              <h3 className="text-2xl font-extrabold text-purple-200">
                👥 Quản lý nhóm dịch
              </h3>

              <p className="mt-2 text-sm text-purple-400">
                Tạo và quản lý các nhóm dịch trên website.
              </p>
            </div>

            {/* FORM TẠO NHÓM */}
            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-purple-200">
                  Tên nhóm dịch
                </label>

                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) =>
                    setGroupForm((current) => ({
                      ...current,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Ví dụ: Yoru Translation Team"
                  className="w-full rounded-xl border border-purple-800 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-purple-500"
                />
              </div>

              <div>
  <label className="mb-2 block text-sm font-semibold text-purple-200">
    Avatar nhóm
  </label>

  <div className="grid gap-4 md:grid-cols-2">

    {/* UPLOAD FILE */}
    <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-purple-800 bg-black/30 px-4 py-5 text-center transition hover:border-pink-400 hover:bg-[#24152f]">

      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGroupAvatarChange}
      />

      {groupAvatarPreview ? (
        <img
          src={groupAvatarPreview}
          alt="Preview avatar nhóm"
          className="h-24 w-24 rounded-full object-cover"
        />
      ) : (
        <>
          <div className="text-4xl">
          </div>

          <p className="mt-2 text-sm font-semibold text-purple-300">
            Chọn avatar từ máy
          </p>

          <p className="mt-1 text-xs text-purple-500">
            JPG, PNG hoặc WEBP
          </p>
        </>
      )}

    </label>

    {/* URL */}
    <div>
      <p className="mb-2 text-sm font-semibold text-purple-300">
        Hoặc dùng URL avatar
      </p>

      <input
        type="text"
        value={groupForm.avatar}
        onChange={(e) =>
          setGroupForm((current) => ({
            ...current,
            avatar: e.target.value,
          }))
        }
        placeholder="https://..."
        disabled={!!groupAvatarFile}
        className="w-full rounded-xl border border-purple-800 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
      />

      {groupAvatarFile && (
        <p className="mt-2 text-xs text-purple-400">
          Đang dùng avatar từ máy:{" "}
          <span className="text-pink-400">
            {groupAvatarFile.name}
          </span>
        </p>
      )}
    </div>

  </div>
</div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-purple-200">
                  Mô tả nhóm
                </label>

                <textarea
                  value={groupForm.description}
                  onChange={(e) =>
                    setGroupForm((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Giới thiệu về nhóm dịch..."
                  className="w-full rounded-xl border border-purple-800 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-purple-500"
                />
              </div>

              <button
                type="button"
                onClick={() => void handleCreateTranslationGroup()}
                disabled={isCreatingGroup}
                className="w-full rounded-xl bg-purple-600 px-5 py-3 font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingGroup
                  ? "⏳ Đang tạo..."
                  : "➕ Tạo nhóm dịch"}
              </button>
            </div>

            {/* DANH SÁCH NHÓM */}
            <div className="mt-10">
              <h4 className="mb-5 text-xl font-bold text-white">
                Danh sách nhóm dịch
              </h4>

              {isLoadingTranslationGroups ? (
                <div className="rounded-xl border border-purple-900 bg-black/20 p-6 text-center text-purple-300">
                  ⏳ Đang tải danh sách nhóm...
                </div>
              ) : translationGroups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-purple-800 bg-black/20 p-6 text-center text-gray-400">
                  Chưa có nhóm dịch nào.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {translationGroups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-2xl border border-purple-800 bg-black/20 p-5"
                    >
                      <div className="flex items-center gap-4">
                        {group.avatar ? (
                          <img
                            src={group.avatar}
                            alt={group.name}
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-900 text-2xl">
                            👥
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h5 className="truncate text-lg font-bold text-white">
                            {group.name}
                          </h5>

                          <p className="mt-1 text-sm text-purple-300">
                            {group._count?.mangas ?? 0} truyện
                          </p>
                        </div>
                      </div>

                      {group.description && (
                        <p className="mt-4 line-clamp-3 text-sm text-gray-400">
                          {group.description}
                        </p>
                      )}

                      <div className="mt-4 flex gap-2">
  <button
    type="button"
    onClick={() =>
      void handleDeleteTranslationGroup(group.id)
    }
    className="rounded-lg border border-red-800 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-950"
  >
    Xóa
  </button>

  <a
    href={`/translation-group/${group.slug}`}
    className="rounded-lg border border-purple-800 px-4 py-2 text-sm font-semibold text-purple-300 transition hover:bg-purple-950"
  >
    Xem trang nhóm →
  </a>
</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </section>

      {/* =====================================================
      FOOTER
      ===================================================== */}

      <footer className="mt-10 bg-gradient-to-r from-[#4b176d] via-[#812681] to-[#c9328d] px-6 py-8 text-center text-white">

        <p className="font-semibold">
          Yoru Translation Group — Admin Dashboard
        </p>

        <p className="mt-1 text-xs text-purple-200">
          Khu vực quản trị
        </p>

      </footer>

    </main>
  );
}