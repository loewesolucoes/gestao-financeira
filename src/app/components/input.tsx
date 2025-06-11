"use client";
import BigNumber from 'bignumber.js';
import moment from 'moment';
import Stackedit from 'stackedit-js';
import { useEffect, useRef } from 'react';

interface CustomProps extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  isNumber?: boolean,
  isPercent?: boolean,
  groupSymbolLeft?: string,
  groupSymbolRight?: string,
  onChange: React.Dispatch<React.SetStateAction<any>>,
  value: any,
}

export function Input(props: CustomProps) {
  const { onChange, isNumber, groupSymbolLeft, groupSymbolRight, isPercent, value, ...otherProps } = props;
  const isInputNumber = props.type === 'number' || isNumber;
  const isInputDate = props.type === 'date';
  const isInputMonth = props.type === 'month';
  const isTextArea = props.type === 'textarea';

  function onChangeInput(event: any) {
    const { value } = event.target;

    const onChangeOrDefault = onChange || function () { };

    if (isPercent)
      onChangeOrDefault(BigNumber(value).div(100));
    else if (isInputNumber)
      onChangeOrDefault(BigNumber(value));
    else if (isInputDate)
      onChangeOrDefault(moment(value, 'YYYY-MM-DD').toDate());
    else if (isInputMonth)
      onChangeOrDefault(moment(value, 'YYYY-MM').toDate());
    else
      onChangeOrDefault(value);
  }

  const inputValue = parseInputValue(value, isInputNumber, isInputDate, isInputMonth, isPercent);
  const input = isTextArea ? <TextArea onChangeInput={onChangeInput} inputValue={inputValue} otherProps={otherProps} /> : <input className="form-control" onChange={onChangeInput} value={inputValue} {...otherProps} />;

  return groupSymbolLeft || groupSymbolRight ? (
    <div className="input-group">
      {groupSymbolLeft && <span className="input-group-text">{groupSymbolLeft}</span>}
      {input}
      {groupSymbolRight && <span className="input-group-text">{groupSymbolRight}</span>}
    </div>
  ) : input;
}

function TextArea({ onChangeInput, inputValue, otherProps }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // const stackedit = new Stackedit();
  // useEffect(() => {
  // }, []);
  function openEditor() {
    const stackedit = new Stackedit();

    stackedit.openFile({
      name: 'New Document',
      content: {
        text: ref.current?.value || '',
      },
    });

    stackedit.on('fileChange', (file) => {
      ref.current!.value = file.content.text;
    });
  }

  return <span style={{ position: 'relative' }}>
    <textarea ref={ref} className="form-control" onChange={onChangeInput} value={inputValue} {...otherProps as any} />
    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={openEditor} style={{ position: 'absolute', bottom: 5, right: 20 }} title="Pressione para abrir o editor completo">📝</button>
  </span>

  // return <div ref={ref} id="editor" {...otherProps}></div>
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

