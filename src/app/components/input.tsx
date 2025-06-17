"use client";
import BigNumber from 'bignumber.js';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import { useEnv } from '../contexts/env';

interface CustomProps extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  isNumber?: boolean,
  isPercent?: boolean,
  groupSymbolLeft?: string,
  groupSymbolRight?: string,
  onChange: React.Dispatch<React.SetStateAction<any>>,
  value: any,
  switch?: any,
}

export function Input(props: CustomProps) {
  const { onChange, isNumber, groupSymbolLeft, groupSymbolRight, isPercent, value, ...otherProps } = props;
  const isInputNumber = props.type === 'number' || isNumber;
  const isInputDate = props.type === 'date';
  const isInputMonth = props.type === 'month';
  const isTextArea = props.type === 'textarea';
  const isMDTextArea = props.type === 'mdtextarea';
  const isCheckbox = props.type === 'checkbox';

  function onChangeInput(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { value, checked } = event.target as any;

    const onChangeOrDefault = onChange || function () { };

    if (isPercent)
      onChangeOrDefault(BigNumber(value).div(100));
    else if (isInputNumber)
      onChangeOrDefault(BigNumber(value));
    else if (isInputDate)
      onChangeOrDefault(moment(value, 'YYYY-MM-DD').toDate());
    else if (isInputMonth)
      onChangeOrDefault(moment(value, 'YYYY-MM').toDate());
    else if (isCheckbox)
      onChangeOrDefault(checked);
    else
      onChangeOrDefault(value);
  }

  const inputValue = parseInputValue(value, isInputNumber, isInputDate, isInputMonth, isPercent);

  let input = isTextArea ? <textarea className="form-control" onChange={onChangeInput} value={inputValue} {...otherProps as any} /> : <input className="form-control" onChange={onChangeInput} value={inputValue} {...otherProps} />;

  if (isMDTextArea) {
    input = <MDTextArea onChangeInput={onChangeInput} inputValue={inputValue} otherProps={otherProps} />;
  }

  return groupSymbolLeft || groupSymbolRight ? (
    <div className="input-group">
      {groupSymbolLeft && <span className="input-group-text">{groupSymbolLeft}</span>}
      {input}
      {groupSymbolRight && <span className="input-group-text">{groupSymbolRight}</span>}
    </div>
  ) : input;
}

function MDTextArea({ onChangeInput, inputValue, otherProps }) {
  const textAsDivRef = useRef<HTMLDivElement>(null);
  const innerDivRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const easyMDERef = useRef<import('../../../node_modules/easymde/types/easymde.d.ts')>(null);
  const { isMobile } = useEnv();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    textAreaRef.current = document.createElement('textarea');
    textAreaRef.current.className = 'form-control';

    innerDivRef.current = document.createElement('div');
    innerDivRef.current.appendChild(textAreaRef.current);

    textAsDivRef.current?.parentNode?.appendChild(innerDivRef.current);

    console.log('MDTextArea component mounted');
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
      console.log('MDTextArea component unmounted');
      cleanUpEasyMDE();
    }
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

  return <textarea ref={textAsDivRef} className="form-control" {...otherProps as any} style={isLoading ? null : { display: "none" }} />

}

function parseInputValue(value: any, isInputNumber?: boolean, isInputDate?: boolean, isInputMonth?: boolean, isPercent?: boolean) {
  if (isInputNumber)
    return parseNumber(value, { isPercent });

  if (isInputDate)
    return moment(value).format('YYYY-MM-DD');

  if (isInputMonth)
    return moment(value).format('YYYY-MM');

  return value || ''
}

function parseNumber(value: BigNumber, { isPercent }: any) {
  if (value == null || isNaN(value.toNumber()))
    return '';

  return isPercent ? value.times(100).toNumber() : value.toNumber();
}

