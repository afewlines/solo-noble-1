import * as THREE from 'three';

const CustomMaterials = {
  gold: new THREE.MeshPhysicalMaterial({
    color: 0xD4AF37,
    roughness: 0.4,
    metalness: 1,
  }),
  silver: new THREE.MeshPhysicalMaterial({
    color: 0xC1C1C1,
    roughness: 0.4,
    metalness: 1,
  }),
  // shadow_base: new THREE.MeshStandardMaterial({
  //   color: 0x000000,
  //   transparent: true,
  //   //blending: THREE.AdditiveBlending,
  //   map: new THREE.TextureLoader()
  //     .load('./resources/images/shadow.png'),
  // }),
  waves: new THREE.ShaderMaterial({
    //transparent: true,
    //blending: THREE.MultiplyBlending,
    //depthTest: false,
    depthWrite: false,
    uniforms: {
      timeMsec: {
        value: 0
      },
      pi: {
        value: Math.PI * 2
      }
    },
    vertexShader: `
        uniform float timeMsec;
        uniform float pi;

        varying vec3 vPos;
        varying float vDist;
        attribute vec3 aVertexCoord;
        uniform mat4 uMVMat;
        uniform mat4 uProjMat;


        void main() {
          vPos = position;
          vDist = sqrt( pow(position.x, 2.0) + pow(position.y, 2.0) );

          vPos.z = (sin( ( pi *timeMsec/1000.0) + (vDist * 4.0)) / -4.0);
          //vPos.z -= pow(vDist/2.0, 2.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4( vPos, 1.0 );
        }`,
    fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        varying float vDist;

        void main() {
          float degree = clamp((pow(vPos.z - 1.0, 2.0) - pow(vDist / 7.0, 8.0) - 0.25) / 2.0, 0.0, 1.0);

          gl_FragColor = vec4(degree*0.9, degree*0.4, degree, clamp(clamp(degree,0.1, 0.9) - vDist, 0.0, 1.0));
        }`,
  }),
  shroud: new THREE.ShaderMaterial({
    //transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      visibility: {
        value: 0.0,
      }
    },
    vertexShader: `
        varying vec3 vPos;
        uniform float visibility;

        void main() {
          vPos = position;
          //gl_Position = gl_Position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,
    fragmentShader: `
        varying vec3 vPos;
        uniform float visibility;

        void main() {
          float degree = (clamp(pow((vPos.y+1.0), 2.0), 0.0, 1.0)) + 0.1 * 0.90;

          gl_FragColor = vec4(0.0, 0.0, 0.0, degree * visibility);
        }`,
  }),
  glowy: function (bc) {
    let temp =  new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bc.renderTarget2.texture },
      },
      vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }`,
      fragmentShader: `
          uniform sampler2D baseTexture;
          uniform sampler2D bloomTexture;

          varying vec2 vUv;

          void main() {
            gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
          }`,
      defines: {},
    });
    return temp;
  },
  dark: new THREE.MeshBasicMaterial({ color: 'black' }),
  axiom: new THREE.MeshPhysicalMaterial({
    color: 0x6CC1E0,
    opacity: 0.5,
    transparent: true,
    roughness: 0.4,
    metalness: 1,
  }),
  toonWood: new THREE.MeshToonMaterial({ color: 0x95784d }),
  // t_fka: new THREE.MeshStandardMaterial({
  //   map: new THREE.TextureLoader()
  //     .load('./resources/images/t-fka.png'),
  //   side: THREE.DoubleSide,
  //   transparent: true,
  //   emissive: 0xF9FBA6,
  // }),
  // t_condolences: new THREE.MeshStandardMaterial({
  //   map: new THREE.TextureLoader()
  //     .load('./resources/images/t-condolences.png'),
  //   depthWrite: false,
  //   transparent: true,
  //   opacity: 0.6,
  //   emissive: 0xFFFFFF,
  // }),

}

export { CustomMaterials }
