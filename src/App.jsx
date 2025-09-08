import Lunita from "./components/Lunita"



function App() {

  return (
    <div className="bg-garden w-screen h-screen relative overflow-hidden">
      <img
        src="/sprites/kneadbed.png"
        alt="Camita"
        id="bed"
        tabIndex={-1} 
        className="absolute bottom-20 left-10 w-32 h-32 image-pixelated caret-transparent select-none pointer-events-none"
      />
    <Lunita />
  </div>
  )
}

export default App
