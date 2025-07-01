import React, { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDesignStore } from '../../stores/designStore'

const DecalPlacement: React.FC = () => {
  const { camera, scene, gl } = useThree()
  const { activeDecalId, decals, updateDecal } = useDesignStore()
  
  useEffect(() => {
    if (!activeDecalId) return
    
    const handleClick = (event: MouseEvent) => {
      const mouse = new THREE.Vector2()
      const rect = gl.domElement.getBoundingClientRect()
      
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, camera)
      
      const intersects = raycaster.intersectObjects(scene.children, true)
      
      if (intersects.length > 0) {
        const point = intersects[0].point
        const normal = intersects[0].face?.normal.clone()
        
        if (normal) {
          // Transform normal to world space
          intersects[0].object?.worldToLocal(normal)
          normal.transformDirection(intersects[0].object?.matrixWorld)
          normal.normalize()
          
          // Calculate rotation from normal
          const rotation = new THREE.Euler().setFromRotationMatrix(
            new THREE.Matrix4().lookAt(new THREE.Vector3(), normal, new THREE.Vector3(0, 1, 0))
          )
          
          updateDecal(activeDecalId, {
            position: [point.x, point.y, point.z],
            rotation: [rotation.x, rotation.y, rotation.z]
          })
        }
      }
    }
    
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [activeDecalId, camera, scene, gl, decals, updateDecal])
  
  return null
}

export default DecalPlacement