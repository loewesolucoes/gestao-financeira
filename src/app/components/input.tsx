"use client";
import BigNumber from 'bignumber.js';
import moment from 'moment';
import { MDTextArea } from './md-text-area';

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

