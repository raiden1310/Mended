// Both copies and their images must be ready before opening the phone's print controls.
export async function printTicketCopies(root=document, print=()=>window.print()) {
  const copies=[...root.querySelectorAll('.print-ticket')];
  if(copies.length!==2)throw new Error('Signed ticket copies are not ready.');
  await Promise.all([...root.querySelectorAll('.print-tickets img')].map(image=>image.decode()));
  print();
}
