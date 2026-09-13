'use client';

import { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Button } from '@vargah/ui/components/button';
import {
  MediaPickerDialog,
  type MediaPickerAsset,
} from '@/components/content/media-picker-dialog';
import { cn } from '@/lib/utils';

type RichTextEditorProps = {
  content?: string;
  onChange?: (html: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  mediaAssets?: MediaPickerAsset[];
};

export function RichTextEditor({
  content = '',
  onChange,
  className,
  disabled,
  placeholder = 'متن مقاله را اینجا بنویسید...',
  mediaAssets = [],
}: RichTextEditorProps) {
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full h-auto' } }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => onChange?.(e.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose-content min-h-[360px] max-w-none p-4 focus:outline-none text-base leading-relaxed',
        dir: 'rtl',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('آدرس لینک:', previous ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const insertImage = useCallback(
    (url: string, alt?: string | null) => {
      if (!editor) return;
      editor.chain().focus().setImage({ src: url, alt: alt ?? '' }).run();
    },
    [editor],
  );

  if (!editor) return null;

  return (
    <>
      <div
        className={cn(
          'overflow-hidden rounded-xl border border-border bg-background shadow-sm',
          disabled && 'opacity-60',
          className,
        )}
      >
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-2">
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              label="↶"
              title="بازگردانی"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              label="↷"
              title="از نو"
            />
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              label="B"
              title="درشت"
              bold
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              label="I"
              title="مورب"
              italic
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
              label="U"
              title="زیرخط"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive('strike')}
              label="S"
              title="خط‌خورده"
            />
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              label="H2"
              title="سرتیتر ۲"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive('heading', { level: 3 })}
              label="H3"
              title="سرتیتر ۳"
            />
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              label="•"
              title="لیست"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              label="1."
              title="لیست شماره‌دار"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive('blockquote')}
              label="❝"
              title="نقل‌قول"
            />
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarButton
              onClick={setLink}
              active={editor.isActive('link')}
              label="🔗"
              title="لینک"
            />
            <ToolbarButton
              onClick={() => setImagePickerOpen(true)}
              label="🖼"
              title="درج تصویر"
            />
          </ToolbarGroup>
        </div>
        <EditorContent editor={editor} />
      </div>

      <MediaPickerDialog
        open={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        onSelect={(asset) => insertImage(asset.url, asset.alt)}
        assets={mediaAssets}
        title="درج تصویر در متن"
      />
    </>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolbarDivider() {
  return <div className="mx-1 hidden h-6 w-px bg-border sm:block" />;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  title,
  bold,
  italic,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  title?: string;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'h-8 min-w-8 rounded-lg px-2 text-sm',
        active && 'bg-primary text-primary-foreground hover:bg-primary/90',
        bold && 'font-bold',
        italic && 'italic',
      )}
    >
      {label}
    </Button>
  );
}

export function getEditorHtml(editor: ReturnType<typeof useEditor>): string {
  return editor?.getHTML() ?? '';
}
