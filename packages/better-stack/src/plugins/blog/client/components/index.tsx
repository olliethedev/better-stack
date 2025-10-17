"use client";
import { HomePageComponent as PostListPageImpl } from "./pages/home-page";
import { NewPostPageComponent as NewPostPageImpl } from "./pages/new-post-page";

// Re-export to ensure the client boundary is preserved
export const PostListPage = PostListPageImpl;
export const NewPostPage = NewPostPageImpl;
