import { Button } from "../ui/button";
import {
	FormControl,
	FormDescription,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { usePluginOverrides } from "@btst/stack/context";
import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { BlogPluginOverrides } from "../../overrides";

export function FeaturedImageField({
	isRequired,
	value,
	onChange,
	setFeaturedImageUploading,
}: {
	isRequired?: boolean;
	value?: string;
	onChange: (value: string) => void;
	setFeaturedImageUploading: (uploading: boolean) => void;
}) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);

	const { uploadImage, Image } =
		usePluginOverrides<BlogPluginOverrides>("blog");

	const ImageComponent = Image ? Image : DefaultImage;

	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file");
			return;
		}

		if (file.size > 4 * 1024 * 1024) {
			toast.error("Image size must be less than 4MB");
			return;
		}

		try {
			setIsUploading(true);
			setFeaturedImageUploading(true);
			const url = await uploadImage(file);
			onChange(url);
			toast.success("Image uploaded successfully");
		} catch (error) {
			toast.error("Failed to upload image");
			console.error("Failed to upload image:", error);
			toast.error("Failed to upload image");
		} finally {
			setIsUploading(false);
			setFeaturedImageUploading(false);
		}
	};

	return (
		<FormItem className="flex flex-col">
			<FormLabel>
				Featured Image
				{isRequired && <span className="text-destructive"> *</span>}
			</FormLabel>
			<FormControl>
				<div className="space-y-2">
					<div className="flex gap-2">
						<Input
							placeholder="Image URL or upload below..."
							value={value || ""}
							onChange={(e) => onChange(e.target.value)}
							disabled={isUploading}
						/>
						<Button
							type="button"
							variant="outline"
							onClick={() => fileInputRef.current?.click()}
							disabled={isUploading}
						>
							{isUploading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Uploading...
								</>
							) : (
								<>
									<Upload className="mr-2 h-4 w-4" />
									Upload
								</>
							)}
						</Button>
					</div>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleImageUpload}
						className="hidden"
					/>
					{isUploading && (
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<Loader2 className="h-4 w-4 animate-spin" />
							Uploading image...
						</div>
					)}
					{value && !isUploading && (
						<div className="relative">
							<ImageComponent
								src={value}
								alt="Featured image preview"
								className="h-auto w-full max-w-xs rounded-md border"
								width={400}
								height={400}
							/>
						</div>
					)}
				</div>
			</FormControl>
			<FormDescription />
			<FormMessage />
		</FormItem>
	);
}

function DefaultImage({
	src,
	alt,
	className,
	width,
	height,
}: {
	src: string;
	alt: string;
	className?: string;
	width?: number;
	height?: number;
}) {
	return (
		<img
			src={src}
			alt={alt}
			className={className}
			width={width}
			height={height}
		/>
	);
}
