let emulator;
let romFile;

document.getElementById('rom-input').addEventListener('change', function(e){
  romFile = e.target.files[0];
  if(romFile) alert(`ROM selecionada: ${romFile.name}`);
});

function startGame(){
  if(!romFile){
    alert('Selecione uma ROM primeiro!');
    return;
  }

  // Configura o canvas
  const canvas = document.getElementById('gameCanvas');

  // Inicializa o EmulatorJS (exemplo)
  // O método abaixo depende da versão do EmulatorJS
  emulator = new EmulatorJS({
    canvas: canvas,
    romFile: romFile,
    system: 'arcade' // para MAME/CPS2
  });

  emulator.loadROM();
}