import { useState, useEffect, useCallback, useMemo } from 'react';

interface LayoutConfig {
  columns: number;
  rows: number;
  cardWidth: number;
  cardHeight: number;
  gap: number;
  scale: number;
}

interface UseAdaptiveLayoutOptions {
  itemCount: number;
  containerWidth: number;
  containerHeight: number;
  minCardWidth?: number;
  maxCardWidth?: number;
  aspectRatio?: number; // card height/width ratio
}

export function useAdaptiveLayout({
  itemCount,
  containerWidth,
  containerHeight,
  minCardWidth = 150,
  maxCardWidth = 500,
  aspectRatio = 1.3,
}: UseAdaptiveLayoutOptions): LayoutConfig {
  return useMemo(() => {
    if (itemCount === 0 || containerWidth === 0 || containerHeight === 0) {
      return {
        columns: 1,
        rows: 1,
        cardWidth: minCardWidth,
        cardHeight: minCardWidth * aspectRatio,
        gap: 16,
        scale: 1,
      };
    }

    // Calculate optimal grid configuration
    let bestConfig: LayoutConfig = {
      columns: 1,
      rows: itemCount,
      cardWidth: minCardWidth,
      cardHeight: minCardWidth * aspectRatio,
      gap: 16,
      scale: 0.5,
    };
    let bestScore = 0;

    // Try different column configurations
    for (let cols = 1; cols <= itemCount; cols++) {
      const rows = Math.ceil(itemCount / cols);
      
      // Calculate available space per card
      const gapSpace = 16; // Base gap
      const totalHorizontalGap = (cols + 1) * gapSpace;
      const totalVerticalGap = (rows + 1) * gapSpace;
      
      const availableWidth = containerWidth - totalHorizontalGap;
      const availableHeight = containerHeight - totalVerticalGap;
      
      const maxCardWidthForCols = availableWidth / cols;
      const maxCardHeightForRows = availableHeight / rows;
      
      // Calculate card size maintaining aspect ratio
      let cardWidth = maxCardWidthForCols;
      let cardHeight = cardWidth * aspectRatio;
      
      // If height is the constraint
      if (cardHeight > maxCardHeightForRows) {
        cardHeight = maxCardHeightForRows;
        cardWidth = cardHeight / aspectRatio;
      }
      
      // Clamp to min/max
      cardWidth = Math.max(minCardWidth, Math.min(maxCardWidth, cardWidth));
      cardHeight = cardWidth * aspectRatio;
      
      // Calculate how much of the viewport is used
      const usedWidth = cardWidth * cols + totalHorizontalGap;
      const usedHeight = cardHeight * rows + totalVerticalGap;
      const fillRatio = (usedWidth * usedHeight) / (containerWidth * containerHeight);
      
      // Score: prioritize filling the screen while keeping cards reasonably sized
      const cardArea = cardWidth * cardHeight;
      const idealCardArea = 200 * 260; // Reference size
      const sizeScore = Math.min(1, cardArea / idealCardArea);
      
      // Penalize configurations that waste space
      const wastedSpace = 1 - (cardWidth * cols) / containerWidth;
      const wastedPenalty = wastedSpace > 0.3 ? wastedSpace : 0;
      
      // Calculate final score
      const score = fillRatio * 0.6 + sizeScore * 0.4 - wastedPenalty * 0.3;
      
      // Ensure cards fit within viewport
      if (usedWidth <= containerWidth && usedHeight <= containerHeight && score > bestScore) {
        bestScore = score;
        bestConfig = {
          columns: cols,
          rows,
          cardWidth: Math.floor(cardWidth),
          cardHeight: Math.floor(cardHeight),
          gap: gapSpace,
          scale: Math.min(1, cardWidth / 200), // Scale relative to ideal card width
        };
      }
    }

    return bestConfig;
  }, [itemCount, containerWidth, containerHeight, minCardWidth, maxCardWidth, aspectRatio]);
}

export function useViewportSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const updateSize = useCallback(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    updateSize();
    
    const handleResize = () => {
      requestAnimationFrame(updateSize);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Also handle fullscreen changes
    document.addEventListener('fullscreenchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('fullscreenchange', handleResize);
    };
  }, [updateSize]);

  return size;
}
