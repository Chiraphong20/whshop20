import React from 'react';
import { 
  Gift, Utensils, Zap, Gamepad2, MoreHorizontal, 
  Coffee, Home, CookingPot, Activity, 
  TrendingUp, Percent, Tent, Box, Plug, 
  PawPrint, Hammer, Sparkles, Store, Armchair,
  Heart, Flame, Pencil, Laptop
} from 'lucide-react';

export const CATEGORIES = [
  // เพิ่มสินค้าขายดีและโปรโมชั่นไว้ด้านบนเพื่อให้เด่นชัด
  { name: 'สินค้าขายดี', icon: <TrendingUp className="w-8 h-8 text-rose-600" />, color: 'bg-rose-50 border-rose-200' },
  { name: 'สินค้าโปรโมชั่น', icon: <Percent className="w-8 h-8 text-red-600" />, color: 'bg-red-50 border-red-200' },
  
  // รายการจากรูปภาพ
  { name: 'ของเล่นเด็ก', icon: <Gamepad2 className="w-8 h-8 text-purple-500" />, color: 'bg-purple-50 border-purple-200' },
  { name: 'อุปกรณ์กีฬา', icon: <Activity className="w-8 h-8 text-green-500" />, color: 'bg-green-50 border-green-200' },
  { name: 'อุปกรณ์ทำความสะอาด', icon: <Sparkles className="w-8 h-8 text-cyan-500" />, color: 'bg-cyan-50 border-cyan-200' },
  { name: 'เครื่องครัว', icon: <CookingPot className="w-8 h-8 text-orange-500" />, color: 'bg-orange-50 border-orange-200' },
  { name: 'อุปกรณ์แคมปิ้ง', icon: <Tent className="w-8 h-8 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-200' },
  { name: 'พลาสติก', icon: <Box className="w-8 h-8 text-blue-400" />, color: 'bg-blue-50 border-blue-200' },
  { name: 'อุปกรณ์ไฟฟ้า', icon: <Zap className="w-8 h-8 text-yellow-500" />, color: 'bg-yellow-50 border-yellow-200' },
  { name: 'เครื่องใช้ไฟฟ้า', icon: <Plug className="w-8 h-8 text-yellow-600" />, color: 'bg-yellow-100 border-yellow-300' },
  { name: 'อุปกรณ์สัตว์เลี้ยง', icon: <PawPrint className="w-8 h-8 text-amber-700" />, color: 'bg-amber-50 border-amber-200' },
  { name: 'เครื่องมือช่าง', icon: <Hammer className="w-8 h-8 text-slate-600" />, color: 'bg-slate-200 border-slate-300' },
  { name: 'สินค้าเทศกาล', icon: <Gift className="w-8 h-8 text-pink-500" />, color: 'bg-pink-50 border-pink-200' },
  { name: 'เซรามิค', icon: <Coffee className="w-8 h-8 text-stone-500" />, color: 'bg-stone-50 border-stone-200' },
  { name: 'อุปกรณ์ขายสินค้า', icon: <Store className="w-8 h-8 text-indigo-500" />, color: 'bg-indigo-50 border-indigo-200' },
  { name: 'ของใช้ในบ้าน', icon: <Armchair className="w-8 h-8 text-teal-600" />, color: 'bg-teal-50 border-teal-200' },
  { name: 'กิ๊ฟช็อป', icon: <Heart className="w-8 h-8 text-pink-400" />, color: 'bg-pink-100 border-pink-300' },
  { name: 'เครื่องบูชา', icon: <Flame className="w-8 h-8 text-red-500" />, color: 'bg-red-50 border-red-200' },
  { name: 'เครื่องเขียน', icon: <Pencil className="w-8 h-8 text-sky-500" />, color: 'bg-sky-50 border-sky-200' },
  { name: 'อุปกรณ์ไอที', icon: <Laptop className="w-8 h-8 text-slate-700" />, color: 'bg-slate-100 border-slate-300' },
  { name: 'เบ็ดเตล็ด', icon: <MoreHorizontal className="w-8 h-8 text-gray-500" />, color: 'bg-gray-100 border-gray-200' },
];