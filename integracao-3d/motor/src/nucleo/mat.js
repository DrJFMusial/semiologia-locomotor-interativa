/** Álgebra mínima (vetores 3D, matrizes 3×3 em linhas, transformações afins x' = R·x + t). Sem dependências. */
export const rad = (d) => (d * Math.PI) / 180;
export const deg = (r) => (r * 180) / Math.PI;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a, b, s) => a + (b - a) * s;

export const v = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  mid: (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
  lerp: (a, b, s) => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s],
  espelho: (a) => [-a[0], a[1], a[2]],
  /** ângulo (graus) entre dois vetores */
  ang: (a, b) => deg(Math.acos(clamp(v.dot(v.norm(a), v.norm(b)), -1, 1))),
};

export const m = {
  I: () => [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  cols: (x, y, z) => [[x[0], y[0], z[0]], [x[1], y[1], z[1]], [x[2], y[2], z[2]]],
  col: (A, j) => [A[0][j], A[1][j], A[2][j]],
  mul: (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j])),
  t: (A) => [0, 1, 2].map((i) => [A[0][i], A[1][i], A[2][i]]),
  app: (A, x) => [A[0][0] * x[0] + A[0][1] * x[1] + A[0][2] * x[2], A[1][0] * x[0] + A[1][1] * x[1] + A[1][2] * x[2], A[2][0] * x[0] + A[2][1] * x[1] + A[2][2] * x[2]],
  rx: (a) => { const c = Math.cos(rad(a)), s = Math.sin(rad(a)); return [[1, 0, 0], [0, c, -s], [0, s, c]]; },
  ry: (a) => { const c = Math.cos(rad(a)), s = Math.sin(rad(a)); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; },
  rz: (a) => { const c = Math.cos(rad(a)), s = Math.sin(rad(a)); return [[c, -s, 0], [s, c, 0], [0, 0, 1]]; },
  /** rotação de a graus em torno do eixo unitário u (regra da mão direita) */
  eixo: (u, a) => {
    const [x, y, z] = v.norm(u), c = Math.cos(rad(a)), s = Math.sin(rad(a)), C = 1 - c;
    return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]];
  },
  /** menor rotação que leva a direção a até a direção b */
  arco: (a, b) => {
    const A = v.norm(a), B = v.norm(b), c = v.cross(A, B), s = v.len(c);
    if (s < 1e-9) return v.dot(A, B) > 0 ? m.I() : m.eixo(Math.abs(A[0]) < 0.9 ? v.norm(v.cross(A, [1, 0, 0])) : v.norm(v.cross(A, [0, 1, 0])), 180);
    return m.eixo(c, deg(Math.atan2(s, v.dot(A, B))));
  },
  /** rotação que leva a base (a1, a2) até a base (b1, b2); as duas primeiras direções coincidem exatamente */
  bases: (a1, a2, b1, b2) => {
    const f = (p, q) => { const x = v.norm(p), z = v.norm(v.cross(x, q)), y = v.cross(z, x); return m.cols(x, y, z); };
    return m.mul(f(b1, b2), m.t(f(a1, a2)));
  },
};
const yxz = (a, b, c) => m.mul(m.mul(m.ry(a), m.rx(b)), m.rz(c));
export const euler = { yxz, decompYXZ: (R) => ({ a: deg(Math.atan2(R[0][2], R[2][2])), b: deg(Math.asin(clamp(-R[1][2], -1, 1))), c: deg(Math.atan2(R[1][0], R[1][1])) }) };

/** Transformações afins { R, t }. */
export const af = {
  I: () => ({ R: m.I(), t: [0, 0, 0] }),
  em: (A, x) => v.add(m.app(A.R, x), A.t),
  comp: (A, B) => ({ R: m.mul(A.R, B.R), t: v.add(m.app(A.R, B.t), A.t) }),
  /** rotação R em torno do ponto p */
  gira: (p, R) => ({ R, t: v.sub(p, m.app(R, p)) }),
  /** leva o ponto de para o ponto para, girando R em torno de de */
  move: (R, de, para) => ({ R, t: v.sub(para, m.app(R, de)) }),
  /** reflexão em X (lado esquerdo a partir do direito): M·A·M */
  espelho: (A) => { const M = [[-1, 0, 0], [0, 1, 0], [0, 0, 1]]; return { R: m.mul(m.mul(M, A.R), M), t: [-A.t[0], A.t[1], A.t[2]] }; },
};
