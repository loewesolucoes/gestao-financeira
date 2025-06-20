"use client";
import './md-text-area.scss';
import { useRef, useState, useEffect } from 'react';
import { useEnv } from '../contexts/env';

export function MDTextArea({ onChangeInput, inputValue, otherProps }) {
  const textAsDivRef = useRef<HTMLDivElement>(null);
  const innerDivRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const easyMDERef = useRef<import('easymde')>(null);
  const { isMobile } = useEnv();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    textAreaRef.current = document.createElement('textarea');
    textAreaRef.current.className = 'form-control';

    innerDivRef.current = document.createElement('div');
    innerDivRef.current.appendChild(textAreaRef.current);

    textAsDivRef.current?.parentNode?.appendChild(innerDivRef.current);

    const EasyMDE = require('easymde'); // Import EasyMDE dynamically to avoid SSR issues

    const defaultToolbar = [
      { name: "bold", action: EasyMDE.toggleBold, text: "N", title: "Negrito" },
      { name: "italic", action: EasyMDE.toggleItalic, text: "I", title: "Itálico" },
      { name: "heading", action: EasyMDE.toggleHeadingSmaller, text: "H", title: "Título" },
      "|",
      { name: "quote", action: EasyMDE.toggleBlockquote, text: "❝", title: "Citação" },
      { name: "unordered-list", action: EasyMDE.toggleUnorderedList, text: "UL", title: "Lista não ordenada" },
      { name: "ordered-list", action: EasyMDE.toggleOrderedList, text: "OL", title: "Lista ordenada" },
      "|",
      { name: "link", action: EasyMDE.drawLink, text: "🔗", title: "Inserir link" },
    ];

    const desktopToolbar = [
      ...defaultToolbar,
      { name: "image", action: EasyMDE.drawImage, text: "🌆", title: "Inserir imagem" },
      { name: "table", action: EasyMDE.drawTable, text: "⏹️", title: "Inserir tabela" },
      "|",
      { name: "horizontal-rule", action: EasyMDE.drawHorizontalRule, text: "↔️", title: "Inserir linha horizontal" },
      { name: "side-by-side", action: EasyMDE.toggleSideBySide, text: "🔀", title: "Lado a lado" },
      { name: "fullscreen", action: EasyMDE.toggleFullScreen, text: "⛶", title: "Tela cheia" },
      "|",
    ];

    const mobileToolbar = [
      ...defaultToolbar,
      { name: "fullscreen", action: EasyMDE.toggleFullScreen, text: "⛶", title: "Tela cheia" },
      {
        name: "others",
        text: "...",
        title: "others buttons",
        children: [
          { name: "image", action: EasyMDE.drawImage, text: "🌆", title: "Inserir imagem" },
          { name: "table", action: EasyMDE.drawTable, text: "⏹️", title: "Inserir tabela" },
          { name: "horizontal-rule", action: EasyMDE.drawHorizontalRule, text: "↔️", title: "Inserir linha horizontal" },
          { name: "side-by-side", action: EasyMDE.toggleSideBySide, text: "🔀", title: "Lado a lado" },
        ]
      },
      "|",
    ];

    easyMDERef.current = new EasyMDE({
      element: textAreaRef.current,
      spellChecker: false,
      autoDownloadFontAwesome: false,
      maxHeight: `${textAsDivRef.current?.offsetHeight || 200 as any}px`,
      maxWidth: `${textAsDivRef.current?.offsetWidth || 600 as any}px`,
      toolbar: isMobile ? mobileToolbar : desktopToolbar,
    });

    easyMDERef.current.value(inputValue);

    easyMDERef.current.codemirror.on("change", () => {
      onChangeInput({
        target: { value: easyMDERef.current?.value() || '' }
      });
    });

    setIsLoading(false);

    return () => {
      setIsLoading(true);
      cleanUpEasyMDE();
    };
  }, [isMobile]);

  useEffect(() => {
    if (easyMDERef.current != null) {
      if (inputValue !== easyMDERef.current.value())
        easyMDERef.current.value(inputValue);
    }
  }, [inputValue]);

  function cleanUpEasyMDE() {
    try {
      (easyMDERef.current?.codemirror as any)?.toTextArea();
    } catch (ex) {
      // TODO: validate why this method is causing an error
    }

    easyMDERef.current?.toTextArea();
    easyMDERef.current?.cleanup();
    textAreaRef.current?.remove();
    textAreaRef.current = null;
    innerDivRef.current?.remove();
    innerDivRef.current = null;
    easyMDERef.current = null;
  }

  return <textarea ref={textAsDivRef} className="form-control" {...otherProps as any} style={isLoading ? null : { display: "none" }} />;

}
