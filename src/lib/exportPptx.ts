import PptxGenJS from 'pptxgenjs';
import type { Capability, Initiative, Effect, EffectType, UIState } from '../types';
import { DIMENSIONS, EFFECT_TYPE_COLORS } from '../types';
import i18n from '../i18n';
import { getMaturityLabel, getRiskLabel, getDimensionLabel, getDateLocale } from './labels';
import { filterInitiatives } from './exportCsv';

const DARK_BG = '1E293B';
const ACCENT = '6366F1';
const LIGHT_TEXT = 'F8FAFC';
const MUTED_TEXT = '94A3B8';

function addShadow() {
  return { type: 'outer' as const, blur: 4, offset: 1, angle: 135, color: '000000', opacity: 0.08 };
}

export function exportPptx(capabilities: Capability[], initiatives: Initiative[], effects: Effect[] = [], filters?: UIState['filters']) {
  initiatives = filterInitiatives(initiatives, filters);
  const pptx = new PptxGenJS();
  pptx.author = 'Cairn';
  pptx.title = i18n.t('export.pptxTitle');
  pptx.layout = 'LAYOUT_WIDE';

  // Cairn mark bars (4 stacked bars in dimension colors)
  const CAIRN_BARS = [
    { w: 0.5, color: 'EF4444' },   // Ledelse (red)
    { w: 0.8, color: '22C55E' },   // Virksomhet (green)
    { w: 1.1, color: 'EAB308' },   // Organisasjon (yellow)
    { w: 1.4, color: '6366F1' },   // Teknologi (indigo)
  ];

  // Slide 1: Title
  const slide1 = pptx.addSlide();
  slide1.background = { color: DARK_BG };
  CAIRN_BARS.forEach((bar, i) => {
    const barX = 0.8 + (1.4 - bar.w) / 2;
    slide1.addShape(pptx.ShapeType.roundRect, {
      x: barX, y: 0.8 + i * 0.32, w: bar.w, h: 0.18, rectRadius: 0.09,
      fill: { color: bar.color },
    });
  });
  slide1.addShape(pptx.ShapeType.rect, { x: 0, y: 2.4, w: 13.33, h: 0.06, fill: { color: ACCENT } });
  slide1.addText('Cairn', { x: 2.4, y: 0.8, w: 9, h: 1.2, fontSize: 36, fontFace: 'Georgia', color: LIGHT_TEXT, bold: true });
  slide1.addText('Strategic roadmap \u2014 From cairn to cairn', { x: 0.8, y: 2.0, w: 11, h: 0.4, fontSize: 14, fontFace: 'Calibri', color: MUTED_TEXT });
  slide1.addText(new Date().toLocaleDateString(getDateLocale(), { day: 'numeric', month: 'long', year: 'numeric' }), { x: 0.8, y: 2.8, w: 11, h: 0.3, fontSize: 11, fontFace: 'Calibri', color: MUTED_TEXT });
  // Dimension badges
  const dims = DIMENSIONS;
  dims.forEach((d, i) => {
    slide1.addShape(pptx.ShapeType.roundRect, { x: 0.8 + i * 2.2, y: 3.4, w: 2.0, h: 0.35, rectRadius: 0.05, fill: { color: d.color.replace('#', '') } });
    slide1.addText(getDimensionLabel(d.key), { x: 0.8 + i * 2.2, y: 3.4, w: 2.0, h: 0.35, fontSize: 10, fontFace: 'Calibri', color: 'FFFFFF', align: 'center', valign: 'middle' });
  });

  // Slide 2: Overview
  const slide2 = pptx.addSlide();
  slide2.addText(i18n.t('export.totalOverview'), { x: 0.5, y: 0.3, w: 12, h: 0.5, fontSize: 20, fontFace: 'Georgia', color: DARK_BG, bold: true });
  DIMENSIONS.forEach((dim, rowIdx) => {
    const y = 1.0 + rowIdx * 1.15;
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: 0.3, y, w: 1.5, h: 0.9, rectRadius: 0.05,
      fill: { color: dim.bgColor.replace('#', '') },
      shadow: addShadow(),
    });
    slide2.addText(getDimensionLabel(dim.key), { x: 0.3, y, w: 1.5, h: 0.9, fontSize: 10, fontFace: 'Calibri', color: dim.textColor.replace('#', ''), align: 'center', valign: 'middle', bold: true });

    const nearInits = initiatives.filter(i => i.dimension === dim.key && i.horizon === 'near').sort((a, b) => a.order - b.order);
    const farInits = initiatives.filter(i => i.dimension === dim.key && i.horizon === 'far').sort((a, b) => a.order - b.order);

    nearInits.forEach((init, idx) => {
      const x = 2.1 + idx * 2.1;
      if (x > 7) return;
      slide2.addShape(pptx.ShapeType.roundRect, { x, y: y + 0.05, w: 2.0, h: 0.8, rectRadius: 0.04, fill: { color: 'FFFFFF' }, line: { color: dim.color.replace('#', ''), width: 1.5 }, shadow: addShadow() });
      slide2.addText(init.name, { x: x + 0.1, y: y + 0.08, w: 1.8, h: 0.4, fontSize: 8, fontFace: 'Calibri', color: DARK_BG, bold: true });
      slide2.addText(init.owner, { x: x + 0.1, y: y + 0.45, w: 1.8, h: 0.3, fontSize: 7, fontFace: 'Calibri', color: MUTED_TEXT });
    });

    farInits.forEach((init, idx) => {
      const x = 7.5 + idx * 2.1;
      if (x > 12.5) return;
      slide2.addShape(pptx.ShapeType.roundRect, { x, y: y + 0.05, w: 2.0, h: 0.8, rectRadius: 0.04, fill: { color: 'FFFFFF' }, line: { color: dim.color.replace('#', ''), width: 1.5, dashType: 'dash' }, shadow: addShadow() });
      slide2.addText(init.name, { x: x + 0.1, y: y + 0.08, w: 1.8, h: 0.4, fontSize: 8, fontFace: 'Calibri', color: DARK_BG, bold: true });
      slide2.addText(init.owner, { x: x + 0.1, y: y + 0.45, w: 1.8, h: 0.3, fontSize: 7, fontFace: 'Calibri', color: MUTED_TEXT });
    });
  });
  // Horizon labels
  slide2.addText(i18n.t('export.nearHorizon'), { x: 2.1, y: 0.7, w: 5, h: 0.25, fontSize: 9, fontFace: 'Calibri', color: MUTED_TEXT });
  slide2.addText(i18n.t('export.farHorizon'), { x: 7.5, y: 0.7, w: 5, h: 0.25, fontSize: 9, fontFace: 'Calibri', color: MUTED_TEXT });

  // Slide 3: Capability map
  const slide3 = pptx.addSlide();
  slide3.addText(i18n.t('export.capabilityMap'), { x: 0.5, y: 0.3, w: 12, h: 0.5, fontSize: 20, fontFace: 'Georgia', color: DARK_BG, bold: true });
  const l1 = capabilities.filter(c => c.level === 1);
  l1.forEach((cap, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = 0.5 + col * 4.1;
    const y = 1.0 + row * 2.6;
    slide3.addShape(pptx.ShapeType.roundRect, { x, y, w: 3.8, h: 2.3, rectRadius: 0.06, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0' }, shadow: addShadow() });
    slide3.addText(cap.name, { x: x + 0.15, y: y + 0.1, w: 3.5, h: 0.35, fontSize: 11, fontFace: 'Calibri', color: DARK_BG, bold: true });
    slide3.addText(`M: ${getMaturityLabel(cap.maturity)}  R: ${getRiskLabel(cap.risk)}`, { x: x + 0.15, y: y + 0.4, w: 3.5, h: 0.25, fontSize: 8, fontFace: 'Calibri', color: MUTED_TEXT });
    const children = capabilities.filter(c => c.parent === cap.id);
    children.forEach((child, ci) => {
      slide3.addText(`\u2022 ${child.name} (M:${child.maturity} R:${child.risk})`, {
        x: x + 0.2, y: y + 0.7 + ci * 0.28, w: 3.4, h: 0.25, fontSize: 8, fontFace: 'Calibri', color: '64748B',
      });
    });
  });

  // Slides 4-7: Dimension slides
  const dimSlides = DIMENSIONS;
  dimSlides.forEach(dim => {
    const slide = pptx.addSlide();
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: dim.color.replace('#', '') } });
    slide.addText(getDimensionLabel(dim.key), { x: 0.5, y: 0.3, w: 12, h: 0.5, fontSize: 20, fontFace: 'Georgia', color: dim.textColor.replace('#', ''), bold: true });

    const near = initiatives.filter(i => i.dimension === dim.key && i.horizon === 'near').sort((a, b) => a.order - b.order);
    const far = initiatives.filter(i => i.dimension === dim.key && i.horizon === 'far').sort((a, b) => a.order - b.order);

    slide.addText(i18n.t('export.nearHorizon'), { x: 0.5, y: 1.0, w: 6, h: 0.3, fontSize: 12, fontFace: 'Calibri', color: DARK_BG, bold: true });
    slide.addText(i18n.t('export.farHorizon'), { x: 6.8, y: 1.0, w: 6, h: 0.3, fontSize: 12, fontFace: 'Calibri', color: DARK_BG, bold: true });

    const renderCard = (init: typeof near[0], x: number, y: number) => {
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.8, h: 1.1, rectRadius: 0.05, fill: { color: 'FFFFFF' }, line: { color: dim.color.replace('#', ''), width: 1.5 }, shadow: addShadow() });
      slide.addText(init.name, { x: x + 0.15, y: y + 0.05, w: 5.5, h: 0.3, fontSize: 11, fontFace: 'Calibri', color: DARK_BG, bold: true });
      slide.addText(init.owner, { x: x + 0.15, y: y + 0.32, w: 5.5, h: 0.2, fontSize: 8, fontFace: 'Calibri', color: MUTED_TEXT });
      const capNames = init.capabilities.map(cid => capabilities.find(c => c.id === cid)?.name).filter(Boolean).join(', ');
      slide.addText(capNames, { x: x + 0.15, y: y + 0.52, w: 5.5, h: 0.2, fontSize: 7, fontFace: 'Calibri', color: '64748B' });
      if (init.notes) {
        slide.addText(`\ud83d\udcac ${init.notes}`, { x: x + 0.15, y: y + 0.75, w: 5.5, h: 0.25, fontSize: 7, fontFace: 'Calibri', color: '3B82F6' });
      }
    };

    near.forEach((init, idx) => renderCard(init, 0.5, 1.4 + idx * 1.25));
    far.forEach((init, idx) => renderCard(init, 6.8, 1.4 + idx * 1.25));
  });

  // Slide 8: Cross-analysis
  const slide8 = pptx.addSlide();
  slide8.addText(i18n.t('export.crossAnalysis'), { x: 0.5, y: 0.3, w: 12, h: 0.5, fontSize: 20, fontFace: 'Georgia', color: DARK_BG, bold: true });
  DIMENSIONS.forEach((dim, idx) => {
    const total = initiatives.filter(i => i.dimension === dim.key).length;
    const nearC = initiatives.filter(i => i.dimension === dim.key && i.horizon === 'near').length;
    const x = 0.5 + (idx % 3) * 4.1;
    const y = 1.0 + Math.floor(idx / 3) * 2.5;
    slide8.addShape(pptx.ShapeType.roundRect, { x, y, w: 3.8, h: 2.0, rectRadius: 0.06, fill: { color: dim.bgColor.replace('#', '') }, shadow: addShadow() });
    slide8.addText(getDimensionLabel(dim.key), { x: x + 0.2, y: y + 0.1, w: 3.4, h: 0.35, fontSize: 13, fontFace: 'Calibri', color: dim.textColor.replace('#', ''), bold: true });
    slide8.addText(i18n.t('export.activitiesCount', { total, near: nearC, far: total - nearC }), { x: x + 0.2, y: y + 0.5, w: 3.4, h: 0.25, fontSize: 9, fontFace: 'Calibri', color: '64748B' });
  });

  // Effect overview slide
  if (effects.length > 0) {
    const effSlide = pptx.addSlide();
    effSlide.addText(i18n.t('export.effectOverview'), { x: 0.5, y: 0.3, w: 12, h: 0.5, fontSize: 20, fontFace: 'Georgia', color: DARK_BG, bold: true });
    const types: EffectType[] = ['cost', 'quality', 'speed', 'compliance', 'strategic'];
    let yPos = 1.0;
    for (const type of types) {
      const typeEffects = effects.filter(e => e.type === type);
      if (typeEffects.length === 0) continue;
      const typeColor = EFFECT_TYPE_COLORS[type].replace('#', '');
      effSlide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: yPos, w: 1.8, h: 0.35, rectRadius: 0.05, fill: { color: typeColor } });
      effSlide.addText(type.charAt(0).toUpperCase() + type.slice(1), { x: 0.5, y: yPos, w: 1.8, h: 0.35, fontSize: 10, fontFace: 'Calibri', color: 'FFFFFF', align: 'center', valign: 'middle' });
      typeEffects.forEach((eff, idx) => {
        const x = 2.6 + idx * 3.2;
        if (x > 12) return;
        effSlide.addShape(pptx.ShapeType.roundRect, { x, y: yPos - 0.05, w: 3.0, h: 0.45, rectRadius: 0.04, fill: { color: 'FFFFFF' }, line: { color: typeColor, width: 1.5 }, shadow: addShadow() });
        effSlide.addText(eff.name, { x: x + 0.1, y: yPos - 0.02, w: 2.8, h: 0.25, fontSize: 9, fontFace: 'Calibri', color: DARK_BG, bold: true });
        if (eff.indicator) {
          effSlide.addText(`${eff.indicator}: ${eff.baseline ?? ''} → ${eff.target ?? ''}`, { x: x + 0.1, y: yPos + 0.2, w: 2.8, h: 0.18, fontSize: 7, fontFace: 'Calibri', color: MUTED_TEXT });
        }
      });
      yPos += 0.7;
    }
  }

  pptx.writeFile({ fileName: `${i18n.t('export.pptxFilename')}-${new Date().toISOString().slice(0, 10)}.pptx` });
}
