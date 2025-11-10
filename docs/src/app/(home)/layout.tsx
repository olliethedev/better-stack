import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";
import { LargeSearchToggle } from "fumadocs-ui/components/layout/search-toggle";
import { CustomSidebarFolder } from "@/components/custom-sidebar-folder";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions}
      searchToggle={{
        components: {
          lg: (
            <div className="flex gap-1.5 max-md:hidden">
              <LargeSearchToggle className="flex-1" />
              
            </div>
          ),
        },
      }}
      sidebar={{
        className:"lg:max-w-72!",
        tabs: {
          transform(option, node) {
            const meta = source.getNodeMeta(node);
            if (!meta || !node.icon) return option;

            const color = `var(--${
              meta.path.split("/")[0]
            }-color, var(--color-fd-foreground))`;

            return {
              ...option,
              icon: (
                <div
                  className="[&_svg]:size-full rounded-lg size-full max-md:bg-(--tab-color)/10 max-md:border max-md:p-1.5"
                  style={
                    {
                      color,
                      "--tab-color": color,
                    } as object
                  }
                >
                  {node.icon}
                </div>
              ),
            };
          },
        },
        components:{
          Folder: CustomSidebarFolder,
        }
      }}
      
    >
      {children}
    </DocsLayout>
  );
}
