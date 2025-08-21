"use client"
import React from 'react';

import { Label } from './ui/label';
import clsx from 'clsx';
import { Input } from './ui/input';
import { Vec2 } from '@/lib/zod';
import { Button } from './ui/button';
import { Eye, EyeClosed } from 'lucide-react';


export type NumberBoxProps = {
  label: string | React.ReactNode;
  value: number;
  setValue: (value: number) => void;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
};

interface PositionBox {
 pos: Vec2
  setData: (pos: Vec2) => void;
  lables: {
    x: string;
    y: string;
  };
}

export interface InputBoxProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  type?: string;
  disabled?: boolean;
  maxLength?: number;
  readOnly?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  label?: string | React.ReactNode;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;

}

export default function InputBox({ className, value, onChange, label, disabled, type, ...other }: InputBoxProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  return (
    <div className={clsx("flex flex-col gap-2.5 justify-center min-w-20", className)}>
      {label && <Label className=" ml-1">{label}</Label>}
      <div className=' flex flex-row  gap-2'>
        <Input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          type={type === 'password' ? (showPassword ? "text" : "password") : type || 'text'}
          {...other}
        />
        {type === 'password' && (
          <Button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            variant={"secondary"}

            size={"icon"}

          >
            {showPassword ? (<EyeClosed />) : (<Eye />)}
          </Button>
        )}
      </div>


    </div>
  )
}

export function PositionBox({ pos, setData ,lables }: PositionBox) {
  return (
    <div className='flex flex-row gap-2 min-w-max '>
     
      <div className='flex flex-row gap-2'>
        <Label className=" ml-1">{lables.x}</Label>
       <Input className='w-16' value={pos.x.toString()} onChange={(e) => setData({ ...pos, x: Number(e.target.value) })}/>
      </div>

      <div className='flex flex-row gap-2'>
        <Label className=" ml-1">{lables.y}</Label>
       <Input className='w-16' value={pos.y.toString()} onChange={(e) => setData({ ...pos, y: Number(e.target.value) })}/>
      </div>
    </div>
  )
  
}

export interface ColorBoxProps {
  color: string
  setColor: (color: string) => void
}
export function ColorBox({ color, setColor }: ColorBoxProps) {
  return (
    <div className='flex flex-col gap-2 min-w-max '>
      <label className=" ">Color</label>
      <Input type='color' className='w-16' value={color} onChange={(e) => setColor(e.target.value)}/>
    </div>
  )
  
}