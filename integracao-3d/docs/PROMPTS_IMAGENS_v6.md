# Prompts das imagens novas: Semiologia do Sistema Locomotor (versão experimental 1.8.1)

Versão 6 · 01/11/2026. Usa o mesmo padrão dos prompts v3.0 e v4.0: mesma paciente, mesmo estilo, prompt e prompt negativo em inglês.

## Como usar

1. **Referências a anexar.**
   - Nas imagens com a paciente, anexe `IMAGENS_GERADAS_v1/ref_d_paciente_locomotor.png` como referência de identidade.
   - Nas imagens de inspeção de costas e de lado, anexe também `AJUSTES_AULA_v1.6.0/gals_coluna_posterior.png` e `gals_coluna_lateral.png`, que fixam o enquadramento e a roupa.
2. **Prompt.** Cole o Prompt. Se o gerador não tiver campo de prompt negativo, cole o negativo no fim, depois de "Avoid:".
3. **Nome do arquivo.** Salve com exatamente o nome indicado (PNG ou WEBP), numa pasta `IMAGENS_GERADAS_v6`.
4. **Conferência.** Me avise quando terminar. Confiro anatomia, lado e enquadramento e coloco as aprovadas em `integracao-3d/imagens/`. A aula troca o esquema pela imagem sozinha, sem outra mudança no código.

**Imagem ainda não aprovada.** Enquanto a imagem de uma situação não for aprovada, a aula mostra nela o esquema aprovado da 1.6.1.

**Texto na imagem.** Nenhuma imagem deve ter texto, seta ou número. Fio de prumo, linhas de nível e nomes de estruturas ficam por conta da aula: nos slides 10 e 16, a aula desenha as linhas sobre a foto; no slide 19, o nome vem dos botões da tela e do atlas 3D ao lado.

### Por que o enquadramento é rígido no slide 10

A aula desenha o fio de prumo e as linhas de nível em posições fixas da imagem:

- **Fio de prumo:** no centro horizontal da imagem.
- **Ombros:** a cerca de 20% da altura, a partir do topo.
- **Ângulos inferiores das escápulas:** a cerca de 30%.
- **Cristas ilíacas:** a cerca de 47%.
- **Vista de frente:** joelhos a 55% e tornozelos a 93%.

Se a imagem sair de outro jeito, eu recalibro as linhas, mas uma imagem que respeite essas medidas economiza esse passo.

## Bloco de personagem e estilo (já embutido nos prompts)

> The patient is a Brazilian woman in her early fifties, medium-light skin, shoulder-length dark brown hair tied back in a low ponytail, average build, wearing a plain dark-gray athletic racerback crop top and navy blue knee-length shorts, barefoot. Realistic clinical-editorial medical illustration, modest athletic clothing, clinical teaching context, soft even studio lighting, natural skin, pure white background.

## Lista

| Arquivo | Slide | O que mostra |
|---|---|---|
| `om60_postura_costas_alinhado` | 10 Inspeção estática | De costas, alinhada |
| `om61_postura_costas_escoliose` | 10 | De costas, escoliose torácica convexa à direita |
| `om62_postura_costas_encurtamento` | 10 | De costas, membro inferior esquerdo mais curto |
| `om63_postura_lado_habitual` | 10 | De lado, curvaturas habituais |
| `om64_postura_lado_cifose` | 10 | De lado, cifose torácica acentuada |
| `om65_postura_lado_lordose` | 10 | De lado, lordose lombar acentuada |
| `om66_postura_frente_habitual` | 10 | Membros inferiores de frente, discreto valgo habitual |
| `om67_postura_frente_varo` | 10 | Membros inferiores de frente, joelho varo |
| `om68_postura_frente_valgo` | 10 | Membros inferiores de frente, joelho valgo |
| `om70_derrame_sem` | 16 Palpação e derrame | Joelho direito sem derrame |
| `om71_derrame_pequeno` | 16 | Derrame pequeno |
| `om72_derrame_moderado` | 16 | Derrame moderado |
| `om73_derrame_volumoso` | 16 | Derrame volumoso |
| `om80_atlas_manguito_geral` | 19 Anatomia funcional | Atlas: manguito rotador completo |
| `om81_atlas_supraespinal` | 19 | Atlas: supraespinal isolado |
| `om82_atlas_infraespinal` | 19 | Atlas: infraespinal isolado |
| `om83_atlas_redondo_menor` | 19 | Atlas: redondo menor isolado |
| `om84_atlas_subescapular` | 19 | Atlas: subescapular isolado |
| `om85_atlas_ombro_osseo` | 19 | Atlas: parte óssea do ombro |
| `om86_atlas_tunel_do_carpo` | 19 | Atlas: túnel do carpo |

Correspondência com os botões do slide 19:

| Botão | Imagem |
|---|---|
| Supraespinal | `om81` |
| Infraespinal | `om82` |
| Redondo menor | `om83` |
| Subescapular | `om84` |
| Bolsa subacromial | `om80` (geral) |
| Arco coracoacromial | `om85` (óssea) |
| Todos os botões do túnel do carpo | `om86` |

---

## Slide 10: Inspeção estática

### Bloco comum das vistas de corpo inteiro (om60 a om65)

```text
Full-body standing photograph of the patient, whole body visible from the top of the head to the soles of the feet, nothing cropped. Portrait 2:3 (1024 x 1536). Camera at the height of the patient's waist, perfectly level, perpendicular to the body, telephoto look with no perspective distortion. The top of the head is at about 4% of the image height and the soles of the feet at about 97%. She stands relaxed, weight on both feet, feet slightly apart, arms hanging at her sides with the hands a little away from the thighs so the waist contour is visible. Hair tied up above the neck so the back of the neck and the shoulders are fully visible. The patient is a Brazilian woman in her early fifties, medium-light skin, shoulder-length dark brown hair tied back in a low ponytail, average build, wearing a plain dark-gray athletic racerback crop top and navy blue knee-length shorts, barefoot. Realistic clinical-editorial medical illustration, modest athletic clothing, clinical teaching context, soft even studio lighting, natural skin, pure white background, no floor line, soft contact shadow under the feet.
```

### om60 · `om60_postura_costas_alinhado.png`

**De costas, alinhada.** Achados da aula:

- ombros na mesma altura;
- escápulas simétricas;
- triângulos de talhe iguais;
- fio de prumo do occipital sobre a coluna e o sulco interglúteo;
- cristas ilíacas e pregas glúteas no mesmo nível.

```text
[BLOCO COMUM]
Posterior view: the camera is directly behind her. The midline of her body (back of the head, spine, gluteal cleft, the point midway between the heels) lies exactly on the vertical center line of the image. Symmetric posture: both shoulders at the same height, both scapulae at the same height and equally flat against the ribs, the two waist triangles (the space between each arm and the waist) equal in size and shape, iliac crests and gluteal folds level.
```

### om61 · `om61_postura_costas_escoliose.png`

**De costas, escoliose torácica.** Achados da aula:

- ombro direito mais alto;
- escápula direita mais alta e saliente;
- triângulo de talhe esquerdo mais aberto e o direito apagado;
- coluna desviada do fio de prumo, com o tronco deslocado para a direita;
- cristas ilíacas e pregas glúteas no mesmo nível.

Lembrete: o lado direito da paciente fica à direita da imagem.

```text
[BLOCO COMUM]
Posterior view: the camera is directly behind her. Her pelvis and feet are centered: the point midway between the heels and the gluteal cleft lie on the vertical center line of the image. She has a moderate right thoracic scoliosis: the thoracic spine curves with its convexity to HER RIGHT (the right side of the image), the line of the spinous processes visibly forms a gentle S, and the whole upper trunk is shifted to HER RIGHT, so the back of her head is slightly to the right of the image center. Her RIGHT shoulder is visibly higher than the left. Her RIGHT scapula is higher and more prominent, its medial border lifting away from the ribs. The waist triangle on HER LEFT side is wide open; on HER RIGHT side the arm hangs close to the flank and the waist triangle is almost closed. Iliac crests and gluteal folds stay level. Natural relaxed stance, not a deliberate lean.
```

### om62 · `om62_postura_costas_encurtamento.png`

**De costas, membro inferior esquerdo mais curto.** Achados da aula:

- crista ilíaca esquerda mais baixa;
- prega glútea esquerda mais baixa;
- curva lombar compensatória, convexa para o lado mais baixo;
- triângulos de talhe discretamente desiguais;
- ombros quase nivelados.

```text
[BLOCO COMUM]
Posterior view: the camera is directly behind her. The point midway between the heels lies on the vertical center line of the image. Her LEFT leg is about 2 cm shorter than the right, both knees fully extended and both soles flat on the floor: her pelvis tilts down to HER LEFT (left side of the image), the left iliac crest and the left gluteal fold are visibly lower than the right ones. The lumbar spine forms a gentle compensatory curve with its convexity to HER LEFT (the lower side), the waist triangles are slightly unequal, and the shoulders are nearly level. No scoliosis rib hump.
```

### om63 · `om63_postura_lado_habitual.png`

**De lado, curvaturas habituais.** A paciente olha para a direita da imagem, como no esquema. Achados da aula:

- lordose cervical: concavidade posterior discreta;
- cifose torácica: convexidade posterior suave;
- lordose lombar: concavidade posterior suave;
- joelhos estendidos, sem hiperextensão.

```text
[BLOCO COMUM]
Pure side view of her RIGHT side, camera perpendicular to her body, she faces the RIGHT edge of the image. The lateral malleolus (outer ankle bone) lies exactly on the vertical center line of the image; the ear lobe, the shoulder, the greater trochanter and the front of the knee lie on or very close to that same vertical line. Normal spinal curves: discrete cervical lordosis, gentle thoracic kyphosis, gentle lumbar lordosis. Knees straight but not hyperextended. Arms hanging slightly in front of the trunk so the back contour from neck to buttocks is fully visible.
```

### om64 · `om64_postura_lado_cifose.png`

**De lado, cifose torácica acentuada.** Achados da aula:

- convexidade torácica aumentada (dorso curvo);
- cabeça projetada para a frente, compensando o tronco;
- lordose lombar suave;
- joelhos estendidos.

```text
[BLOCO COMUM]
Pure side view of her RIGHT side, camera perpendicular to her body, she faces the RIGHT edge of the image. The lateral malleolus lies exactly on the vertical center line of the image. She has an accentuated thoracic kyphosis: the upper back is clearly rounded, forming a smooth hump between the shoulder blades, the shoulders roll forward, and the head and neck project forward so the ear lies well in FRONT of the shoulder and of the vertical center line. Lumbar curve gentle and normal, knees straight. Posture natural, not exaggerated into a caricature; she looks straight ahead.
```

### om65 · `om65_postura_lado_lordose.png`

**De lado, lordose lombar acentuada.** Achados da aula:

- concavidade lombar aumentada;
- nádegas mais salientes;
- abdome projetado para a frente.

```text
[BLOCO COMUM]
Pure side view of her RIGHT side, camera perpendicular to her body, she faces the RIGHT edge of the image. The lateral malleolus lies exactly on the vertical center line of the image. She has an accentuated lumbar lordosis: the lower back is deeply hollowed, the pelvis is tilted forward (anterior pelvic tilt), the buttocks project backward and the abdomen protrudes forward. Thoracic curve and head position normal, knees straight. Posture natural, not exaggerated into a caricature.
```

### Bloco comum das vistas de frente (om66 a om68)

```text
Frontal photograph of the lower limbs, from the navel to the soles of the feet, nothing cropped below. Portrait 2:3 (1024 x 1536). Camera at knee height, perfectly level, perpendicular to the body, telephoto look with no perspective distortion. The navel is at about 6% of the image height, the center of the kneecaps at about 55% and the ankle bones at about 93%. She stands relaxed facing the camera, weight on both feet, toes pointing forward, kneecaps facing forward, hands resting on her upper thighs out of the knee area. The patient is a Brazilian woman in her early fifties, medium-light skin, average build, wearing a plain dark-gray athletic racerback crop top and navy blue knee-length shorts that end just above the knees, barefoot. Realistic clinical-editorial medical illustration, clinical teaching context, soft even studio lighting, natural skin, pure white background, soft contact shadow under the feet.
```

### om66 · `om66_postura_frente_habitual.png`

**Discreto valgo habitual.** Joelhos e tornozelos quase se tocam ao mesmo tempo; patelas para a frente e na mesma altura.

```text
[BLOCO COMUM FRENTE]
Normal alignment with the usual slight valgus: when she stands with her feet together, the inner sides of the knees and the inner ankle bones almost touch at the same time. Kneecaps facing forward at the same height, thighs and calves symmetric.
```

### om67 · `om67_postura_frente_varo.png`

**Joelho varo.** Joelhos afastados com os tornozelos juntos: membros arqueados para fora.

```text
[BLOCO COMUM FRENTE]
Genu varum (bow legs): she stands with her inner ankle bones touching, and there is a clear gap of about two finger-widths between her knees; both legs curve outward like brackets. Kneecaps facing forward at the same height, symmetric on both sides.
```

### om68 · `om68_postura_frente_valgo.png`

**Joelho valgo.** Joelhos juntos com os tornozelos afastados: angulação excessiva para dentro.

```text
[BLOCO COMUM FRENTE]
Genu valgum (knock knees): the inner sides of her knees touch, and there is a clear gap of about two finger-widths between her inner ankle bones; the thighs angle inward and the lower legs angle outward. Kneecaps facing forward at the same height, symmetric on both sides.
```

### Prompt negativo comum do slide 10

```text
text, letters, labels, arrows, numbers, plumb line, measurement lines, grid, watermark, logo, collage, multiple panels, split screen, mirrored scene, cropped head, cropped feet, perspective distortion, wide-angle lens, extra limbs, extra fingers, deformed hands, jewelry, shoes, socks, hospital gown, sensual pose, lingerie, cartoon, 3D render, dark background, colored background, exaggerated caricature deformity, leaning on one leg, hand on hip, crossed legs
```

### Conferência do slide 10

1. **Paciente e roupa.** Mesma paciente e mesma roupa da referência.
2. **Enquadramento.**
   - Corpo inteiro: cabeça e pés inteiros.
   - Vista de frente: do umbigo aos pés.
3. **Linha média.**
   - De costas: o ponto entre os calcanhares no centro horizontal.
   - De lado: o maléolo lateral no centro horizontal.
4. **Lado.**
   - De costas, o lado direito da paciente fica à direita da imagem.
   - De lado, ela olha para a direita da imagem.
5. **Achado.** O achado da situação aparece sem precisar de legenda, e as demais regiões ficam normais.

---

## Slide 16: Palpação e derrame (quatro graus)

As quatro imagens ocupam o lugar da "vista anterior do joelho direito" e precisam ser tomadas com a mesma câmera e a mesma luz, porque o aluno as compara lado a lado. O corte sagital, o rechaço e o sinal da onda passam a ser mostrados pelo joelho 3D ao lado.

### Bloco comum (om70 a om73)

```text
Close-up clinical photograph of the patient's RIGHT knee seen from the front, patient lying supine on an examination table covered with a plain white sheet, leg fully extended and relaxed, quadriceps relaxed. Portrait 3:4 (1152 x 1536). Camera directly above the knee looking straight down at the kneecap, frame from the middle of the thigh (about 15 cm above the kneecap) to the middle of the shin; the kneecap is centered horizontally and sits at about 55% of the image height; the inner (medial) side of the knee is on the RIGHT side of the image and the outer (lateral) side on the LEFT. Soft raking light from the upper left so that hollows and bulges around the kneecap are readable. Only the knee region, the lower edge of navy blue shorts at the top of the frame and the table are visible; no hands, no examiner. Same patient as the reference: Brazilian woman in her early fifties, medium-light skin. Realistic clinical-editorial medical photograph, natural skin texture, no redness, pure white surroundings.
```

### om70 · `om70_derrame_sem.png`

**Sem derrame.** Contornos normais: a depressão de cada lado da patela é visível, e a região acima dela é plana.

```text
[BLOCO COMUM]
Normal knee without effusion: the kneecap outline is sharp, there is a clear shallow hollow on each side of the kneecap (the medial and lateral parapatellar hollows), and the area just above the kneecap is flat, following the contour of the thigh.
```

### om71 · `om71_derrame_pequeno.png`

**Derrame pequeno.** Só o lado medial muda: a depressão medial desaparece. É a imagem do abaulamento positivo com rechaço negativo.

```text
[BLOCO COMUM]
Small knee effusion: the hollow on the inner (medial) side of the kneecap is filled in and slightly full, while the outer hollow is still faintly visible. The kneecap outline remains sharp and the area above the kneecap is almost flat. Subtle finding, as seen in real practice.
```

### om72 · `om72_derrame_moderado.png`

**Derrame moderado.** Tumefação em ferradura em volta da patela. A região suprapatelar fica cheia. As duas depressões desaparecem.

```text
[BLOCO COMUM]
Moderate knee effusion: both hollows beside the kneecap are filled and bulging slightly, and there is a soft horseshoe-shaped swelling around the upper half of the kneecap extending a few centimeters above it into the suprapatellar region. The kneecap is still visible but its edges are softened. No redness.
```

### om73 · `om73_derrame_volumoso.png`

**Derrame volumoso.** Contorno distendido e tenso. A bolsa suprapatelar faz relevo acima da patela, e a patela parece "flutuar".

```text
[BLOCO COMUM]
Large tense knee effusion: the whole knee is distended and rounded, the swelling extends well above the kneecap as a firm bulge in the suprapatellar pouch, the normal hollows beside the kneecap have disappeared completely and the kneecap edges are barely visible, the kneecap appears lifted. The skin is smooth and taut, no redness, no bruising.
```

### Prompt negativo do slide 16

```text
text, letters, labels, arrows, numbers, watermark, logo, collage, multiple panels, hands, examiner, needle, syringe, bandage, redness, bruising, wound, scar, tattoo, jewelry, left knee, bent knee, standing patient, side view, dark background, cartoon, 3D render, X-ray, MRI, anatomical cutaway
```

### Conferência do slide 16

1. **Joelho e enquadramento.** Joelho direito, visto de frente: lado medial à direita da imagem, patela centrada.
2. **Série.** As quatro imagens têm a mesma câmera, a mesma luz e o mesmo enquadramento.
3. **Progressão dos graus.**
   - Sem derrame: duas depressões visíveis.
   - Pequeno: só a depressão medial cheia.
   - Moderado: ferradura e região suprapatelar cheia.
   - Volumoso: distensão tensa, patela mal delimitada.

---

## Slide 19: Atlas do manguito rotador (6 imagens) e do túnel do carpo (1 imagem)

Estilo de atlas: ilustração anatômica original, com cores de atlas e fundo branco. As imagens precisam ser coerentes entre si: mesmo traço e mesma iluminação, e cada músculo com a mesma cor em todas as imagens em que aparecer.

**Cores dos músculos.** São as mesmas que o atlas 3D usa ao destacar cada estrutura:

| Músculo | Cor |
|---|---|
| Supraespinal | vermelho |
| Infraespinal | laranja-terracota |
| Redondo menor | violeta |
| Subescapular | azul |

**Texto.** Sem texto: os nomes vêm dos botões da tela e do atlas 3D ao lado. Se quiser uma versão rotulada para outro uso, gere à parte. Geradores de imagem costumam errar letras, e a aula não deve exibir rótulos com erro.

**Referências para conferência (não copiar figuras):**

- Netter, Atlas de Anatomia Humana, pranchas do ombro e do punho;
- Moore, Anatomia Orientada para a Clínica, figuras do manguito rotador e do túnel do carpo.

Conferir na fonte as pranchas usadas.

### Bloco comum do atlas (om80 a om86)

```text
Original anatomical atlas illustration in the style of a classic hand-painted medical atlas plate: precise anatomy, soft volumetric shading, muscles drawn with visible fiber direction, tendons glossy white, bones ivory with subtle texture, cartilage pale blue-white. Pure white background, no frame, no shadow box. Landscape 3:2 (1536 x 1024). No text, no labels, no leader lines, no arrows, no numbers. Anatomically accurate adult RIGHT side.
```

### om80 · `om80_atlas_manguito_geral.png`

**Manguito rotador completo**, em vista posterolateral do ombro direito, com os quatro músculos nas suas cores. O subescapular, que é anterior, aparece pela borda medial ou pela fossa subescapular, através do recorte da escápula.

```text
[BLOCO COMUM DO ATLAS]
Right shoulder, posterolateral three-quarter view from behind and slightly above, showing the scapula, the lateral third of the clavicle and the proximal half of the humerus. All four rotator cuff muscles are shown together, each in its own flat color tint over the natural muscle shading: supraspinatus RED in the supraspinous fossa passing under the acromion to the top of the greater tubercle; infraspinatus TERRACOTTA ORANGE in the infraspinous fossa inserting on the middle facet of the greater tubercle; teres minor VIOLET along the lateral border of the scapula inserting on the lower facet of the greater tubercle; subscapularis BLUE visible deep to the scapula through its medial border and wrapping the front of the humeral head to the lesser tubercle. Their tendons blend into a single cuff over the humeral head. The subacromial bursa is shown as a thin translucent pale-blue sac between the acromion and the supraspinatus tendon. Deltoid removed. Clear, uncluttered composition.
```

### om81 · `om81_atlas_supraespinal.png`

```text
[BLOCO COMUM DO ATLAS]
Right shoulder, posterosuperior view from behind and above, showing the scapula, the lateral clavicle, the acromion and the proximal humerus. ONLY the supraspinatus muscle is shown, tinted RED: it fills the supraspinous fossa above the scapular spine, runs laterally under the acromion and the coracoacromial ligament, and its tendon inserts on the superior facet of the greater tubercle of the humerus. All other muscles removed; bones fully visible.
```

### om82 · `om82_atlas_infraespinal.png`

```text
[BLOCO COMUM DO ATLAS]
Right shoulder, direct posterior view, showing the whole scapula and the proximal humerus. ONLY the infraspinatus muscle is shown, tinted TERRACOTTA ORANGE: it fills the infraspinous fossa below the scapular spine, its fibers converge laterally behind the shoulder joint, and its tendon inserts on the middle facet of the greater tubercle. All other muscles removed; bones fully visible.
```

### om83 · `om83_atlas_redondo_menor.png`

```text
[BLOCO COMUM DO ATLAS]
Right shoulder, direct posterior view, same camera as the infraspinatus plate, showing the whole scapula and the proximal humerus. ONLY the teres minor muscle is shown, tinted VIOLET: a narrow muscle arising from the upper two-thirds of the lateral border of the scapula, running upward and laterally behind the shoulder joint, its tendon inserting on the inferior facet of the greater tubercle, just below the infraspinatus insertion. All other muscles removed; bones fully visible.
```

### om84 · `om84_atlas_subescapular.png`

```text
[BLOCO COMUM DO ATLAS]
Right shoulder, direct anterior view, showing the anterior (costal) surface of the scapula with the coracoid process, the lateral clavicle and the proximal humerus; ribs removed. ONLY the subscapularis muscle is shown, tinted BLUE: it fills the subscapular fossa on the front of the scapula, passes in front of the shoulder joint below the coracoid process, and its tendon inserts on the lesser tubercle of the humerus. All other muscles removed; bones fully visible.
```

### om85 · `om85_atlas_ombro_osseo.png`

**Parte óssea.** Também serve ao botão "Arco coracoacromial".

```text
[BLOCO COMUM DO ATLAS]
Right shoulder skeleton, lateral three-quarter view from the front and slightly above, showing the scapula (acromion, scapular spine, coracoid process, glenoid cavity, supraspinous and infraspinous fossae), the clavicle with the acromioclavicular joint, and the proximal humerus (head, anatomical neck, greater and lesser tubercles, intertubercular groove). The coracoacromial ligament is shown as a thin pale band from the coracoid process to the acromion, forming with them the coracoacromial arch above the humeral head; no other soft tissue. Clean, didactic, bones ivory.
```

### om86 · `om86_atlas_tunel_do_carpo.png`

**Túnel do carpo.** Imagem única: vista palmar do punho direito dissecado, com um corte transversal na mesma prancha. Se o gerador errar a composição dupla, peça só a vista palmar (primeira metade do prompt).

```text
[BLOCO COMUM DO ATLAS]
Right wrist and palm, palmar view (palm facing the viewer, thumb on the LEFT of the image), skin and palmar fascia removed. The flexor retinaculum (transverse carpal ligament) is shown as a firm white band bridging from the scaphoid and trapezium tubercles on the thumb side to the pisiform and the hook of the hamate on the little-finger side, with a rectangular window cut in its middle to reveal the carpal tunnel. Through the window: the median nerve (yellow) lying superficially just beneath the retinaculum, and the nine flexor tendons (four flexor digitorum superficialis, four flexor digitorum profundus, flexor pollicis longus) glossy white, wrapped in translucent pale-blue synovial sheaths (the common flexor sheath and the separate sheath of flexor pollicis longus). On the little-finger side, OUTSIDE the tunnel and superficial to the retinaculum, the ulnar nerve (yellow) and ulnar artery (red) pass through Guyon's canal beside the pisiform. On the right half of the plate, a small transverse cross-section of the same wrist at the level of the retinaculum, palmar side up, thumb side left: carpal bones arranged in an arch, the retinaculum closing the arch, the median nerve and nine tendons inside the tunnel, Guyon's canal with ulnar nerve and artery at the upper right, and the first dorsal compartment (abductor pollicis longus and extensor pollicis brevis tendons) at the lower left on the radial side.
```

### Prompt negativo do slide 19

```text
text, letters, labels, leader lines, arrows, numbers, watermark, logo, signature, photograph, photo of a cadaver, blood, gore, skin, face, cartoon, flat vector icon, 3D render with plastic look, dark background, colored background, left side, mirrored anatomy, extra muscles, deltoid covering the cuff, missing bones, distorted fingers, extra fingers
```

### Conferência do slide 19

1. **Lado.** Lado direito e vista pedida em cada prancha.
2. **Músculo isolado e inserção.** Cada prancha de músculo isolado mostra só aquele músculo, inserido no ponto certo:
   - supraespinal: faceta superior do tubérculo maior;
   - infraespinal: faceta média;
   - redondo menor: faceta inferior;
   - subescapular: tubérculo menor.
3. **Cores.** As cores são as mesmas em todas as pranchas.
4. **Túnel do carpo.**
   - O nervo mediano fica dentro do túnel, junto ao retináculo.
   - Os nove tendões estão dentro do túnel.
   - O nervo e a artéria ulnares ficam fora do túnel, no canal de Guyon.
5. **Texto.** Nenhum texto na imagem.

---

## Slide 21: Ortolani e Barlow

Por sua decisão, a aula experimental passou a usar as três fotos `om50_ortolani_inicio`, `om51_ortolani_abducao` e `om52_barlow_aducao`, que antes estavam marcadas como rascunho em `IMAGENS_GERADAS_v5/RASCUNHOS_NAO_APROVADOS`. As setas são desenhadas pela aula sobre a foto. Se quiser refazê-las, os prompts continuam em `PROMPT_IMAGEM_BARLOW_ORTOLANI.md`. Mantendo o mesmo enquadramento, as setas seguem servindo.
