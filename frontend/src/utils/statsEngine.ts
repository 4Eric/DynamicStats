import { BattingLine, PitchingLine } from '../types';

export function calculateBattingStats(lines: BattingLine[]) {
  const totals = lines.reduce(
    (acc, line) => {
      acc.AB += line.AB;
      acc.R += line.R;
      acc.H += line.H;
      acc.RBI += line.RBI;
      acc.BB += line.BB;
      acc.SO += line.SO;
      acc.doubles += line.doubles;
      acc.triples += line.triples;
      acc.HR += line.HR;
      acc.TB += line.TB;
      acc.SB += line.SB;
      acc.CS += line.CS;
      acc.HBP += line.HBP;
      return acc;
    },
    {
      AB: 0, R: 0, H: 0, RBI: 0, BB: 0, SO: 0, doubles: 0,
      triples: 0, HR: 0, TB: 0, SB: 0, CS: 0, HBP: 0
    }
  );

  const PA = totals.AB + totals.BB + totals.HBP; // simplistic PA
  const AVG = totals.AB > 0 ? totals.H / totals.AB : 0;
  const OBP = PA > 0 ? (totals.H + totals.BB + totals.HBP) / PA : 0;
  const SLG = totals.AB > 0 ? totals.TB / totals.AB : 0;
  const OPS = OBP + SLG;
  const CT = totals.AB > 0 ? ((totals.AB - totals.SO) / totals.AB) * 100 : 0;

  return {
    ...totals,
    PA,
    AVG: AVG.toFixed(3).replace(/^0/, ''),
    OBP: OBP.toFixed(3).replace(/^0/, ''),
    SLG: SLG.toFixed(3).replace(/^0/, ''),
    OPS: OPS.toFixed(3).replace(/^0/, ''),
    CT_pct: CT.toFixed(1) + '%'
  };
}

export function parseIP(ipDec: number): number {
  const full = Math.floor(ipDec);
  const frac = ipDec - full;
  // .1 = 1/3, .2 = 2/3
  if (Math.abs(frac - 0.1) < 0.05) return full + 1/3;
  if (Math.abs(frac - 0.2) < 0.05) return full + 2/3;
  return ipDec;
}

export function formatIP(ip: number): string {
  const full = Math.floor(ip);
  const frac = ip - full;
  if (Math.abs(frac - 1/3) < 0.05) return `${full}.1`;
  if (Math.abs(frac - 2/3) < 0.05) return `${full}.2`;
  return full.toString() + '.0'; // or just full.toString()
}

export function calculatePitchingStats(lines: PitchingLine[]) {
  const totals = lines.reduce(
    (acc, line) => {
      acc.IP_num += parseIP(line.IP);
      acc.H += line.H;
      acc.R += line.R;
      acc.ER += line.ER;
      acc.BB += line.BB;
      acc.SO += line.SO;
      acc.HBP += line.HBP;
      acc.pitches += line.pitches;
      acc.strikes += line.strikes;
      acc.BF += line.BF;
      acc.WP += line.WP;
      return acc;
    },
    {
      IP_num: 0, H: 0, R: 0, ER: 0, BB: 0, SO: 0,
      HBP: 0, pitches: 0, strikes: 0, BF: 0, WP: 0
    }
  );

  const ERA = totals.IP_num > 0 ? (totals.ER * 6) / totals.IP_num : 0; // assuming 6 inning youth games
  const WHIP = totals.IP_num > 0 ? (totals.BB + totals.H) / totals.IP_num : 0;
  const K6 = totals.IP_num > 0 ? (totals.SO * 6) / totals.IP_num : 0; // K per 6 for youth
  const strikePct = totals.pitches > 0 ? (totals.strikes / totals.pitches) * 100 : 0;

  return {
    ...totals,
    IP_formatted: formatIP(totals.IP_num),
    ERA: ERA.toFixed(2),
    WHIP: WHIP.toFixed(2),
    K6: K6.toFixed(2),
    strikePct: strikePct.toFixed(1) + '%'
  };
}
