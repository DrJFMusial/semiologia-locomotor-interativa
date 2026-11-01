"""Atlas regional 3D da aula (ombro, punho, joelho) a partir do Z-Anatomy (CC BY-SA 4.0; base BodyParts3D, CC BY-SA 2.1 JP).
Gera src/modelos/atlas_<regiao>.glb e src/modelos/atlas.json.
Cada objeto vira um nó chamado <categoria>__<chave>; o JSON guarda o centro e o tamanho de cada região.
Uso: python3 atlas_regioes.py  (módulo bpy; FBX em /home/claude/za)
"""
import bpy, bmesh, json, os
from mathutils import Vector
SRC = '/home/claude/za/'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'modelos') + '/'

bpy.ops.wm.read_factory_settings(use_empty=True)
for f in ['SkeletalSystem100.fbx', 'MuscularSystem100.fbx', 'Joints100.fbx', 'NervousSystem100.fbx']:
    bpy.ops.import_scene.fbx(filepath=SRC + f)
O = {o.name: o for o in bpy.data.objects if o.type == 'MESH'}
print('malhas', len(O))

def wbox(nomes):
    vs = [O[n].matrix_world @ v.co for n in nomes for v in O[n].data.vertices]
    return Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs))), Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))

CARPO = ['Scaphoid bone.r', 'Lunate bone.r', 'Triquetrum bone.r', 'Pisiform bone.r', 'Trapezium bone.r', 'Trapezoid bone.r', 'Capitate bone.r', 'Hamate bone.r']
METAC = ['First metacarpal bone.r', 'Second metacarpal bone.r', 'Third metacarpal bone.r', 'Fourth metacarpal bone.r', 'Fifth metacarpal bone.r']
REG = {
    'ombro': {
        'itens': [('osso', 'escapula', 'Scapula.r'), ('osso', 'clavicula', 'Clavicle.r'), ('osso', 'umero', 'Humerus.r'),
                  ('musculo', 'supra', 'Supraspinatus muscle.r'), ('musculo', 'infra', 'Infraspinatus muscle.r'),
                  ('musculo', 'redondo', 'Teres minor muscle.r'), ('musculo', 'sub', 'Subscapularis muscle.r'),
                  ('bolsa', 'bolsa', 'Subacromial bursa.r'), ('ligamento', 'arco', 'Coraco-acromial ligament.r')],
        'corte': lambda: (lambda a, b: (Vector((a.x - 0.05, a.y - 0.08, b.z - 0.26)), Vector((b.x + 0.05, b.y + 0.08, b.z + 0.03))))(*wbox(['Scapula.r', 'Clavicle.r'])),
        'alvo': 2600,
    },
    'punho': {
        'itens': [('osso', 'radio', 'Radius.r'), ('osso', 'ulna', 'Ulna.r')] + [('osso', 'carpo', n) for n in CARPO] + [('osso', 'metacarpo', n) for n in METAC] +
                 [('ligamento', 'ret', 'Flexor retinaculum of wrist.r'),
                  ('tendao', 'fds', 'Humero-ulnar head of flexor digitorum superficialis.r'), ('tendao', 'fds', 'Radial head of flexor digitorum superficialis.r'),
                  ('tendao', 'fdp', 'Flexor digitorum profundus.r'), ('tendao', 'fpl', 'Flexor pollicis longus.r'),
                  ('bainha', 'bainha_comum', 'Common flexor tendon sheath.r'), ('bainha', 'bainha_fpl', 'Tendon sheath of flexor pollicis longus.r'),
                  ('bainha', 'bainha_fcr', 'Tendon sheath of flexor carpi radialis.r'), ('bainha', 'comp1', 'Tendon sheath - abd. pollicis longus - ext. pollicis brevis.r'),
                  ('nervo', 'mediano', 'Median nerve.r'), ('nervo', 'mediano', 'Common palmar digital branches of median nerve.r'),
                  ('nervo', 'ulnar', 'Ulnar nerve.r'), ('nervo', 'ulnar', 'Superficial branch of ulnar nerve.r'), ('nervo', 'ulnar', 'Deep branch of ulnar nerve.r')],
        'corte': lambda: (lambda a, b: (Vector((a.x - 0.03, a.y - 0.05, a.z - 0.035)), Vector((b.x + 0.03, b.y + 0.05, b.z + 0.075))))(*wbox(CARPO)),
        'alvo': 2200,
    },
    'joelho': {
        'itens': [('osso', 'femur', 'Femur.r'), ('osso', 'patela', 'Patella.r'), ('osso', 'tibia', 'Tibia.r'), ('osso', 'fibula', 'Fibula.r'),
                  ('capsula', 'capsula', 'Articular capsule of knee joint.r'), ('bolsa', 'suprapatelar', 'Suprapatellar bursa.r'),
                  ('menisco', 'menisco', 'Medial meniscus.r'), ('menisco', 'menisco', 'Lateral meniscus.r'), ('gordura', 'hoffa', 'Infrapatellar fat pad.r'),
                  ('musculo', 'quadriceps', 'Rectus femoris muscle.r'), ('musculo', 'quadriceps', 'Vastus medialis muscle.r'), ('musculo', 'quadriceps', 'Vastus lateralis muscle.r'),
                  ('musculo', 'quadriceps', 'Vastus intermedius muscle.r')],
        'corte': lambda: (lambda a, b: (Vector((a.x - 0.06, a.y - 0.03, a.z - 0.13)), Vector((b.x + 0.06, b.y + 0.13, b.z + 0.20))))(*wbox(['Patella.r'])),
        'alvo': 2400,
    },
}

def cortar(ob, a, b):
    bm = bmesh.new(); bm.from_mesh(ob.data); bm.transform(ob.matrix_world)
    for co, no in [((a.x, 0, 0), (-1, 0, 0)), ((b.x, 0, 0), (1, 0, 0)), ((0, a.y, 0), (0, -1, 0)), ((0, b.y, 0), (0, 1, 0)), ((0, 0, a.z), (0, 0, -1)), ((0, 0, b.z), (0, 0, 1))]:
        geo = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geo, plane_co=co, plane_no=no, clear_outer=True)
    me = bpy.data.meshes.new(ob.name + '_c'); bm.to_mesh(me); bm.free()
    return me

meta = {}
for reg, R in REG.items():
    a, b = R['corte']()
    c = (a + b) / 2
    bpy.ops.object.select_all(action='DESELECT')
    novos = []
    for cat, chave, nome in R['itens']:
        if nome not in O: print('AUSENTE', reg, nome); continue
        me = cortar(O[nome], a, b)
        if len(me.vertices) < 4: print('vazio', reg, nome); continue
        for v in me.vertices: v.co -= c
        ob = bpy.data.objects.new(f'{cat}__{chave}', me); bpy.context.scene.collection.objects.link(ob)
        n = len(me.vertices)
        if n > R['alvo']:
            md = ob.modifiers.new('d', 'DECIMATE'); md.ratio = max(0.08, R['alvo'] / n)
            bpy.context.view_layer.objects.active = ob; ob.select_set(True); bpy.ops.object.modifier_apply(modifier='d'); ob.select_set(False)
        for p in me.polygons: p.use_smooth = True
        novos.append(ob)
        print(reg, cat, chave, nome, n, '->', len(ob.data.vertices))
    for ob in bpy.data.objects: ob.select_set(ob in novos)
    bpy.ops.export_scene.gltf(filepath=OUT + f'atlas_{reg}.glb', use_selection=True, export_format='GLB', export_yup=True, export_apply=True,
                              export_normals=True, export_materials='NONE', export_animations=False, export_skins=False, export_morph=False)
    tam = b - a
    meta[reg] = {'tamanho': [round(tam.x, 4), round(tam.z, 4), round(tam.y, 4)]}
    for ob in novos: bpy.data.objects.remove(ob)
json.dump(meta, open(OUT + 'atlas.json', 'w'), indent=1)
print(meta)
