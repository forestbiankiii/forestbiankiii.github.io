"use client";

import { useEffect, useState } from "react";
import Lanyard from "@/components/Lanyard";
import { withBasePath } from "@/components/sitePath";

const CONTACT = {
  name: "Wang Maolin",
  educationEmail: "2335060723@st.usst.edu.cn",
  personalEmail: "forestbiankiii@gmail.com",
  github: "github.com/forestbiankiii",
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.closePath();
}

function drawLabel(context, label, value, y) {
  context.fillStyle = "#78808c";
  context.font = "700 19px Arial, sans-serif";
  context.letterSpacing = "2px";
  context.fillText(label.toUpperCase(), 72, y);
  context.fillStyle = "#111827";
  context.font = "600 29px Arial, sans-serif";
  context.fillText(value, 72, y + 39);
}

function drawFrontFace(photo, lang) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1260;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#f5f6f0";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#bef264";
  context.fillRect(0, 0, canvas.width, 22);

  context.fillStyle = "#111827";
  context.font = "700 24px Arial, sans-serif";
  context.letterSpacing = "3px";
  context.fillText("USST · ACADEMIC ID", 72, 80);
  context.fillStyle = "#606975";
  context.font = "600 18px Arial, sans-serif";
  context.fillText("SCHOOL OF INTELLIGENT SCIENCE AND TECHNOLOGY", 72, 116);

  context.save();
  roundedRect(context, 72, 158, 360, 420, 42);
  context.clip();
  const sourceSize = Math.min(photo.width, photo.height);
  context.drawImage(
    photo,
    (photo.width - sourceSize) / 2,
    (photo.height - sourceSize) / 2,
    sourceSize,
    sourceSize,
    72,
    158,
    360,
    420,
  );
  context.restore();

  context.fillStyle = "#111827";
  context.font = "700 50px Arial, sans-serif";
  context.fillText(lang === "zh" ? "汪懋林" : CONTACT.name, 474, 265);
  context.fillStyle = "#4b5563";
  context.font = "600 25px Arial, sans-serif";
  context.fillText(lang === "zh" ? CONTACT.name : "Undergraduate", 474, 310);
  context.font = "500 22px Arial, sans-serif";
  context.fillText(lang === "zh" ? "本科生" : "Materials Science", 474, 360);
  context.fillText(lang === "zh" ? "材料科学与工程" : "& Engineering", 474, 398);

  context.fillStyle = "#111827";
  roundedRect(context, 474, 464, 320, 84, 42);
  context.fill();
  context.fillStyle = "#bef264";
  context.font = "700 19px Arial, sans-serif";
  context.letterSpacing = "2px";
  context.fillText("NANOPHOTONICS", 516, 515);

  context.fillStyle = "#d5d8d3";
  context.fillRect(72, 630, 756, 2);
  drawLabel(context, lang === "zh" ? "教育邮箱" : "Education email", CONTACT.educationEmail, 696);
  drawLabel(context, lang === "zh" ? "个人邮箱" : "Personal email", CONTACT.personalEmail, 816);
  drawLabel(context, "GitHub", CONTACT.github, 936);

  context.fillStyle = "#111827";
  context.fillRect(0, 1112, 900, 148);
  context.fillStyle = "#bef264";
  context.font = "700 21px Arial, sans-serif";
  context.letterSpacing = "3px";
  context.fillText("LIGHT · MATTER · COMPUTING", 72, 1182);
  context.fillStyle = "#d1d5db";
  context.font = "500 17px Arial, sans-serif";
  context.fillText("University of Shanghai for Science and Technology", 72, 1220);

  return canvas.toDataURL("image/png");
}

function drawBackFace(lang) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1260;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#111827";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#bef264";
  context.fillRect(0, 0, canvas.width, 22);
  context.strokeStyle = "#334155";
  context.lineWidth = 2;
  context.strokeRect(72, 72, 756, 1116);

  context.fillStyle = "#bef264";
  context.font = "700 190px Arial, sans-serif";
  context.fillText("WM", 70, 295);
  context.fillStyle = "#f8fafc";
  context.font = "700 38px Arial, sans-serif";
  context.fillText(lang === "zh" ? "研究方向" : "RESEARCH FOCUS", 76, 420);

  const interests =
    lang === "zh"
      ? ["纳米光子学", "光学计算", "飞秒激光加工", "量子材料"]
      : ["Nanophotonics", "Optical computing", "Femtosecond laser processing", "Quantum materials"];
  interests.forEach((interest, index) => {
    const y = 510 + index * 94;
    context.fillStyle = index === 0 ? "#bef264" : "#94a3b8";
    context.fillRect(78, y - 19, 15, 15);
    context.fillStyle = "#e5e7eb";
    context.font = "600 29px Arial, sans-serif";
    context.fillText(interest, 122, y);
  });

  context.fillStyle = "#334155";
  context.fillRect(76, 910, 748, 2);
  context.fillStyle = "#94a3b8";
  context.font = "700 18px Arial, sans-serif";
  context.letterSpacing = "2px";
  context.fillText("CONTACT", 76, 978);
  context.fillStyle = "#f8fafc";
  context.font = "600 27px Arial, sans-serif";
  context.fillText(CONTACT.personalEmail, 76, 1028);
  context.fillText(CONTACT.github, 76, 1078);
  context.fillStyle = "#bef264";
  context.font = "700 18px Arial, sans-serif";
  context.fillText("BIANKIII · 2026", 76, 1155);

  return canvas.toDataURL("image/png");
}

export default function AcademicLanyard({ lang = "en" }) {
  const [faces, setFaces] = useState({ front: null, back: null });

  useEffect(() => {
    let cancelled = false;
    loadImage(withBasePath("/profile.jpg"))
      .then((photo) => {
        if (cancelled) return;
        setFaces({
          front: drawFrontFace(photo, lang),
          back: drawBackFace(lang),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setFaces({ front: drawBackFace(lang), back: drawBackFace(lang) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return (
    <div className="academic-lanyard-shell">
      {!faces.front && (
        <div className="academic-lanyard-loading" aria-hidden="true">
          {lang === "zh" ? "正在生成胸牌" : "Preparing badge"}
        </div>
      )}
      {faces.front && (
        <Lanyard
          position={[0, 0, 24]}
          gravity={[0, -40, 0]}
          fov={23}
          frontImage={faces.front}
          backImage={faces.back}
          imageFit="contain"
          lanyardWidth={0.92}
        />
      )}
      <div className="sr-only">
        <h3>{lang === "zh" ? "汪懋林的学术胸牌" : "Wang Maolin academic badge"}</h3>
        <p>University of Shanghai for Science and Technology</p>
        <a href={`mailto:${CONTACT.educationEmail}`}>{CONTACT.educationEmail}</a>
        <a href={`mailto:${CONTACT.personalEmail}`}>{CONTACT.personalEmail}</a>
        <a href={`https://${CONTACT.github}`}>{CONTACT.github}</a>
      </div>
    </div>
  );
}
