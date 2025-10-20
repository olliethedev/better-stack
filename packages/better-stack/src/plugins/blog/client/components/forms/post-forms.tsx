"use client";
import {
	createPostSchema as PostCreateSchema,
	updatePostSchema as PostUpdateSchema,
} from "../../../schemas";

import { Button } from "../ui/button";

import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { useCreatePost, usePost, useUpdatePost } from "../../hooks/blog-hooks";
// import { useBlogContext } from "@/hooks/context-hooks"
import { slugify } from "../../../utils";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { memo, useMemo, useState } from "react";
import {
	type FieldPath,
	type SubmitHandler,
	type UseFormReturn,
	useForm,
} from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FeaturedImageField } from "./image-field";
import { MarkdownEditor } from "./markdown-editor";

type CommonPostFormValues = {
	title: string;
	content: string;
	excerpt?: string;
	slug?: string;
	image?: string;
	published?: boolean;
};

function PostFormBody<T extends CommonPostFormValues>({
	form,
	onSubmit,
	submitLabel,
	onCancel,
	disabled,
	errorMessage,
	setFeaturedImageUploading,
}: {
	form: UseFormReturn<T>;
	onSubmit: SubmitHandler<T>;
	submitLabel: string;
	onCancel: () => void;
	disabled: boolean;
	errorMessage?: string;
	setFeaturedImageUploading: (uploading: boolean) => void;
}) {
	const nameTitle = "title" as FieldPath<T>;
	const nameSlug = "slug" as FieldPath<T>;
	const nameExcerpt = "excerpt" as FieldPath<T>;
	const nameImage = "image" as FieldPath<T>;
	const nameContent = "content" as FieldPath<T>;
	const namePublished = "published" as FieldPath<T>;
	return (
		<Form {...form}>
			<form className="w-full space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
				{errorMessage && (
					<div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
						{errorMessage}
					</div>
				)}

				<FormField
					control={form.control}
					name={nameTitle}
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Title
								<span className="text-destructive"> *</span>
							</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter your post title..."
									{...field}
									value={String(field.value ?? "")}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name={nameSlug}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Slug</FormLabel>
							<FormControl>
								<Input
									placeholder="url-friendly-slug"
									{...field}
									value={String(field.value ?? "")}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name={nameExcerpt}
					render={({ field }) => (
						<FormItem className="flex flex-col">
							<FormLabel>Excerpt</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Brief summary of your post..."
									className="min-h-20"
									value={String(field.value ?? "")}
									onChange={field.onChange}
								/>
							</FormControl>
							<FormDescription />
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name={nameImage}
					render={({ field }) => (
						<FeaturedImageField
							isRequired={false}
							value={String(field.value ?? "")}
							onChange={field.onChange}
							setFeaturedImageUploading={setFeaturedImageUploading}
						/>
					)}
				/>

				<FormField
					control={form.control}
					name={nameContent}
					render={({ field }) => (
						<FormItem className="flex flex-col">
							<FormLabel>
								Content
								<span className="text-destructive"> *</span>
							</FormLabel>
							<FormControl>
								<MarkdownEditor
									className="min-h-80 max-w-full"
									value={typeof field.value === "string" ? field.value : ""}
									onChange={(content: string) => {
										field.onChange(content);
									}}
								/>
							</FormControl>
							<FormDescription />
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name={namePublished}
					render={({ field }) => (
						<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
							<div className="space-y-0.5">
								<FormLabel>Published</FormLabel>
								<FormDescription>Toggle to publish immediately</FormDescription>
							</div>
							<FormControl>
								<Switch
									checked={!!field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
						</FormItem>
					)}
				/>

				<div className="flex gap-2 pt-4">
					<Button type="submit" disabled={disabled}>
						{submitLabel}
					</Button>
					<Button
						variant="outline"
						onClick={onCancel}
						disabled={disabled}
						type="button"
					>
						Cancel
					</Button>
				</div>
			</form>
		</Form>
	);
}

const CustomPostCreateSchema = PostCreateSchema.omit({
	createdAt: true,
	updatedAt: true,
	publishedAt: true,
});

const CustomPostUpdateSchema = PostUpdateSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	publishedAt: true,
});

type AddPostFormProps = {
	onClose: () => void;
	onSuccess: (post: { published: boolean }) => void;
};

const addPostFormPropsAreEqual = (
	prevProps: AddPostFormProps,
	nextProps: AddPostFormProps,
): boolean => {
	if (prevProps.onClose !== nextProps.onClose) return false;
	if (prevProps.onSuccess !== nextProps.onSuccess) return false;
	return true;
};

const AddPostFormComponent = ({ onClose, onSuccess }: AddPostFormProps) => {
	const [featuredImageUploading, setFeaturedImageUploading] = useState(false);

	// const { uploadImage } = useBlogContext()

	const schema = CustomPostCreateSchema;

	const {
		mutateAsync: createPost,
		isPending: isCreatingPost,
		error: createPostError,
	} = useCreatePost();

	type AddPostFormValues = z.input<typeof schema>;
	const onSubmit = async (data: AddPostFormValues) => {
		// Auto-generate slug from title if not provided
		const slug = data.slug || slugify(data.title);

		// Wait for mutation to complete, including refresh
		const createdPost = await createPost({
			title: data.title,
			content: data.content,
			excerpt: data.excerpt ?? "",
			slug,
			published: data.published ?? false,
			publishedAt: data.published ? new Date() : undefined,
			image: data.image,
		});

		toast.success("Post created successfully");

		// Navigate only after mutation completes
		onSuccess({ published: createdPost?.published ?? false });
	};

	// For compatibility with resolver types that require certain required fields,
	// cast the generics to the exact inferred input type to avoid mismatch on optional slug
	const form = useForm<z.input<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			title: "",
			content: "",
			excerpt: "",
			slug: undefined,
			published: false,
			image: "",
		},
	});

	return (
		<PostFormBody
			form={form}
			onSubmit={onSubmit}
			submitLabel={isCreatingPost ? "Creating..." : "Create Post"}
			onCancel={onClose}
			disabled={isCreatingPost || featuredImageUploading}
			errorMessage={createPostError?.message}
			setFeaturedImageUploading={setFeaturedImageUploading}
		/>
	);
};

export const AddPostForm = memo(AddPostFormComponent, addPostFormPropsAreEqual);

type EditPostFormProps = {
	postSlug: string;
	onClose: () => void;
	onSuccess: (post: { published: boolean }) => void;
};

const editPostFormPropsAreEqual = (
	prevProps: EditPostFormProps,
	nextProps: EditPostFormProps,
): boolean => {
	if (prevProps.postSlug !== nextProps.postSlug) return false;
	if (prevProps.onClose !== nextProps.onClose) return false;
	if (prevProps.onSuccess !== nextProps.onSuccess) return false;
	return true;
};

const EditPostFormComponent = ({
	postSlug,
	onClose,
	onSuccess,
}: EditPostFormProps) => {
	const [featuredImageUploading, setFeaturedImageUploading] = useState(false);
	// const { uploadImage } = useBlogContext()

	const { post } = usePost(postSlug);

	const initialData = useMemo(() => {
		if (!post) return {};
		return {
			title: post.title,
			content: post.content,
			excerpt: post.excerpt,
			slug: post.slug,
			published: post.published,
			image: post.image || "",
		};
	}, [post]);

	const schema = CustomPostUpdateSchema;

	const {
		mutateAsync: updatePost,
		isPending: isUpdatingPost,
		error: updatePostError,
	} = useUpdatePost();

	type EditPostFormValues = z.input<typeof schema>;
	const onSubmit = async (data: EditPostFormValues) => {
		// Wait for mutation to complete, including refresh
		const updatedPost = await updatePost({
			id: post!.id,
			data: {
				id: post!.id,
				title: data.title,
				content: data.content,
				excerpt: data.excerpt ?? "",
				slug: data.slug,
				published: data.published ?? false,
				publishedAt:
					data.published && !post?.published
						? new Date()
						: post?.publishedAt
							? new Date(post.publishedAt)
							: undefined,
				image: data.image,
			},
		});

		toast.success("Post updated successfully");

		// Navigate only after mutation completes
		onSuccess({ published: updatedPost?.published ?? false });
	};

	// Don't render the form until post data is loaded
	if (!post) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-6 w-6 animate-spin" />
				<span className="ml-2">Loading post...</span>
			</div>
		);
	}

	const form = useForm<z.input<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			title: "",
			content: "",
			excerpt: "",
			slug: "",
			published: false,
			image: "",
		},
		values: initialData as z.input<typeof schema>,
	});

	return (
		<PostFormBody
			form={form}
			onSubmit={onSubmit}
			submitLabel={isUpdatingPost ? "Updating..." : "Update Post"}
			onCancel={onClose}
			disabled={isUpdatingPost || featuredImageUploading}
			errorMessage={updatePostError?.message}
			setFeaturedImageUploading={setFeaturedImageUploading}
		/>
	);
};

export const EditPostForm = memo(
	EditPostFormComponent,
	editPostFormPropsAreEqual,
);
