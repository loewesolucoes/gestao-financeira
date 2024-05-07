"use client";
import BigNumber from 'bignumber.js';
import moment from 'moment';

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

  function onChangeInput(event: any) {
    const { value } = event.target;

    const onChangeOrDefault = onChange || function () { };

    if (isPercent)
      onChangeOrDefault(BigNumber(value).div(100));
    else if (isInputNumber)
      onChangeOrDefault(BigNumber(value));
    else if (isInputDate)
      onChangeOrDefault(moment(value, 'YYYY-MM-DD').toDate());
    else
      onChangeOrDefault(value);
  }

  const inputValue = parseInputValue(value, isInputNumber, isInputDate, isPercent);
  const input = <input className="form-control" onChange={onChangeInput} value={inputValue} {...otherProps} />;

  return groupSymbolLeft || groupSymbolRight ? (
    <div className="input-group mb-3">
      {groupSymbolLeft && <span className="input-group-text">{groupSymbolLeft}</span>}
      {input}
      {groupSymbolRight && <span className="input-group-text">{groupSymbolRight}</span>}
    </div>
  ) : input;
}

function parseInputValue(value: any, isInputNumber?: boolean, isInputDate?: boolean, isPercent?: boolean) {
  if (value == null)
    return value || ''

  if (isInputNumber)
    return parseNumber(value, { isPercent });

  if (isInputDate)
    return moment(value).format('YYYY-MM-DD');
}

function parseNumber(value: BigNumber, { isPercent }: any) {
  if (value == null || isNaN(value.toNumber()))
    return '';

  return isPercent ? value.times(100).toNumber() : value.toNumber();
}

