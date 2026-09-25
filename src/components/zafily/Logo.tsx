// Rosa oficial da marca. Fica literal de propósito: é a única cor do símbolo e
// não muda com o tema nem com o escopo onde o logo é usado.
const SYMBOL_PINK = "#F759AD";

// Preto/branco do wordmark. A marca manda alternar os dois conforme o fundo, e
// deixar isso explícito evita o bug que existia aqui: o wordmark era branco fixo
// e sumia nas telas claras (login, cadastro, sidebar).
const WORDMARK = { dark: "#0C0C0C", light: "#FFFFFF" } as const;

interface LogoProps {
  size?: number;
  showText?: boolean;
  /** "dark" = wordmark preto (fundos claros, padrão). "light" = branco. */
  tone?: keyof typeof WORDMARK;
}

// Ícone Z isolado (viewBox dos paths do ícone: x 8-327, y 8-225)
export function ZafilyLogo({ size = 32, showText = true, tone = "dark" }: LogoProps) {
  const h = Math.round(size * (233 / 335));
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={h}
        viewBox="8 8 319 217"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 321.0 9.0 L 236.0 9.0 L 191.0 58.0 L 155.0 100.0 L 155.0 102.0 L 249.0 103.0 L 266.0 98.0 L 278.0 92.0 L 290.0 83.0 L 301.0 72.0 L 312.0 55.0 L 320.0 32.0 Z M 182.0 9.0 L 95.0 8.0 L 87.0 11.0 L 70.0 28.0 L 10.0 100.0 L 10.0 102.0 L 105.0 103.0 L 123.0 98.0 L 135.0 92.0 L 157.0 74.0 L 172.0 52.0 L 180.0 30.0 Z" fill={SYMBOL_PINK} fillRule="evenodd" clipRule="evenodd" />
        <path d="M 327.0 125.0 L 228.0 124.0 L 210.0 129.0 L 196.0 136.0 L 185.0 144.0 L 175.0 154.0 L 166.0 167.0 L 156.0 189.0 L 153.0 200.0 L 151.0 224.0 L 244.0 225.0 L 252.0 220.0 L 268.0 204.0 L 327.0 127.0 Z M 177.0 125.0 L 84.0 124.0 L 64.0 129.0 L 50.0 136.0 L 30.0 154.0 L 18.0 172.0 L 10.0 195.0 L 8.0 207.0 L 8.0 224.0 L 97.0 224.0 L 128.0 189.0 L 176.0 129.0 Z" fill={SYMBOL_PINK} fillRule="evenodd" clipRule="evenodd" />
      </svg>
      {showText && (
        <ZafilyWordmark height={h} tone={tone} />
      )}
    </div>
  );
}

// Wordmark: preto ou branco conforme o `tone`, seguindo a regra da marca.
function ZafilyWordmark({ height = 24, tone = "dark" }: { height?: number; tone?: keyof typeof WORDMARK }) {
  const w = Math.round(height * (621 / 180));
  return (
    <svg
      width={w}
      height={height}
      viewBox="388 60 562 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M 543.0 95.0 L 549.0 93.0 L 567.0 93.0 L 578.0 98.0 L 582.0 101.0 L 588.0 108.0 L 591.0 114.0 L 594.0 124.0 L 593.0 139.0 L 591.0 145.0 L 586.0 153.0 L 575.0 162.0 L 566.0 165.0 L 559.0 165.0 L 558.0 166.0 L 545.0 164.0 L 536.0 159.0 L 529.0 152.0 L 525.0 145.0 L 522.0 135.0 L 522.0 124.0 L 525.0 113.0 L 530.0 105.0 Z M 949.0 68.0 L 921.0 68.0 L 919.0 70.0 L 896.0 138.0 L 891.0 150.0 L 888.0 149.0 L 888.0 146.0 L 880.0 128.0 L 876.0 115.0 L 869.0 100.0 L 867.0 92.0 L 858.0 70.0 L 856.0 68.0 L 827.0 68.0 L 826.0 69.0 L 835.0 89.0 L 839.0 101.0 L 842.0 106.0 L 842.0 108.0 L 845.0 113.0 L 847.0 120.0 L 850.0 125.0 L 852.0 132.0 L 858.0 144.0 L 860.0 151.0 L 863.0 156.0 L 866.0 166.0 L 875.0 185.0 L 875.0 189.0 L 871.0 198.0 L 862.0 208.0 L 855.0 211.0 L 843.0 212.0 L 842.0 213.0 L 842.0 238.0 L 843.0 239.0 L 858.0 239.0 L 870.0 236.0 L 883.0 228.0 L 892.0 218.0 L 899.0 205.0 L 899.0 203.0 L 903.0 196.0 L 904.0 191.0 L 908.0 183.0 L 917.0 156.0 L 923.0 143.0 L 924.0 138.0 L 926.0 135.0 L 927.0 130.0 L 929.0 127.0 L 930.0 122.0 L 944.0 87.0 L 948.0 73.0 L 950.0 70.0 Z M 732.0 68.0 L 731.0 69.0 L 731.0 190.0 L 758.0 190.0 L 759.0 189.0 L 759.0 69.0 L 758.0 68.0 Z M 391.0 68.0 L 390.0 69.0 L 390.0 95.0 L 442.0 95.0 L 443.0 98.0 L 388.0 167.0 L 388.0 190.0 L 484.0 190.0 L 485.0 189.0 L 485.0 164.0 L 484.0 163.0 L 429.0 163.0 L 428.0 162.0 L 428.0 160.0 L 439.0 146.0 L 441.0 145.0 L 460.0 120.0 L 484.0 91.0 L 484.0 69.0 L 483.0 68.0 Z M 515.0 79.0 L 505.0 90.0 L 500.0 98.0 L 495.0 112.0 L 494.0 125.0 L 493.0 126.0 L 494.0 141.0 L 498.0 156.0 L 502.0 164.0 L 510.0 175.0 L 524.0 186.0 L 539.0 192.0 L 545.0 192.0 L 546.0 193.0 L 562.0 193.0 L 573.0 190.0 L 584.0 184.0 L 592.0 176.0 L 594.0 177.0 L 594.0 189.0 L 595.0 190.0 L 621.0 190.0 L 622.0 189.0 L 622.0 70.0 L 620.0 68.0 L 596.0 68.0 L 594.0 70.0 L 594.0 81.0 L 592.0 82.0 L 584.0 74.0 L 575.0 69.0 L 566.0 66.0 L 550.0 65.0 L 549.0 66.0 L 541.0 66.0 L 532.0 69.0 L 522.0 74.0 Z M 785.0 16.0 L 785.0 189.0 L 786.0 190.0 L 812.0 190.0 L 813.0 189.0 L 813.0 16.0 Z M 709.0 15.0 L 694.0 14.0 L 693.0 15.0 L 683.0 16.0 L 672.0 21.0 L 663.0 29.0 L 657.0 39.0 L 654.0 50.0 L 654.0 66.0 L 652.0 68.0 L 639.0 68.0 L 638.0 69.0 L 638.0 74.0 L 637.0 75.0 L 637.0 94.0 L 638.0 95.0 L 652.0 95.0 L 654.0 97.0 L 654.0 189.0 L 655.0 190.0 L 681.0 190.0 L 682.0 189.0 L 682.0 97.0 L 684.0 95.0 L 710.0 95.0 L 711.0 94.0 L 711.0 69.0 L 710.0 68.0 L 683.0 68.0 L 682.0 67.0 L 682.0 56.0 L 684.0 50.0 L 690.0 44.0 L 698.0 41.0 L 709.0 41.0 L 710.0 40.0 L 710.0 17.0 Z M 741.0 13.0 L 734.0 16.0 L 728.0 22.0 L 726.0 28.0 L 726.0 35.0 L 729.0 42.0 L 734.0 47.0 L 741.0 50.0 L 749.0 50.0 L 756.0 47.0 L 760.0 43.0 L 763.0 37.0 L 763.0 25.0 L 760.0 20.0 L 754.0 15.0 L 748.0 13.0 Z" fill={WORDMARK[tone]} fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

// Logo completo (ícone + wordmark lado a lado)
export function ZafilyLogoFull({ height = 32 }: { height?: number }) {
  return <ZafilyLogo size={Math.round(height * (335 / 233))} showText />;
}
