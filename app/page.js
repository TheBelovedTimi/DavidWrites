import Link from 'next/link';
import { listBooks } from './lib/db';
import LibraryBrowser from './components/LibraryBrowser';

export const dynamic='force-dynamic';

export default async function HomePage() {
  const books=await listBooks();
  return (
    <main>
      <header className="site-header"><div className="shell site-header-inner"><Link className="wordmark" href="/">DAVID//WRITES</Link><nav className="nav"><a href="#library">Library</a><a href="#about">About David</a></nav></div></header>
      <section className="hero shell"><div className="eyebrow">Personal fiction · works in progress</div><h1>Stories from other versions.</h1><p>A living library of fiction, fragments and books still becoming. Read what is published, return for what changes, and follow the work as it takes shape.</p></section>
      <section id="library" className="section shell"><div className="section-head"><h2>The library</h2><p>Stories at different stages of becoming.</p></div><LibraryBrowser books={books}/></section>

      <section id="about" className="section shell" style={{paddingTop:80,paddingBottom:110}}>
        <div style={{maxWidth:900,margin:'0 auto',borderTop:'1px solid rgba(255,255,255,.12)',paddingTop:48}}>
          <div className="eyebrow">Behind the words</div>
          <h2 style={{fontSize:'clamp(2.2rem,6vw,4.5rem)',margin:'10px 0 28px',letterSpacing:'-.04em'}}>About David</h2>
          <div style={{display:'grid',gap:20,fontSize:'clamp(1rem,2vw,1.15rem)',lineHeight:1.85,maxWidth:780}}>
            <p>David is a Nigerian writer, creative technologist and designer whose work lives somewhere between imagination, introspection and the quiet questions people often carry without saying aloud. He writes stories that are less interested in perfect heroes than in human beings caught between who they are, who they have been, and the versions of themselves they might still become.</p>
            <p>His creative life does not exist in a single lane. Away from the page, David works with technology and design — building websites, shaping digital experiences and turning ideas into things people can see and interact with. That instinct to build also follows him into his writing. A story, to him, is not simply a collection of sentences. It is an atmosphere, a world, a visual language and sometimes an unanswered question deliberately left in the reader's mind.</p>
            <p>Much of his writing is drawn toward memory, identity, fear, hope, relationships, inner conflict and the strange distance between the life we imagined and the life we eventually find ourselves living. Some stories arrive as fiction. Others begin as fragments, reflections or uncomfortable “what ifs.” Across them all is the same fascination: the hidden versions of a person — the choices never made, the words never spoken, the paths abandoned, and the possibility that becoming is never truly finished.</p>
            <p>David Writes is the home for that process. It is intentionally a living library rather than a polished shelf of finished books. Here, stories can appear chapter by chapter, change as they grow, disappear back into drafts and return in a different form. Readers are invited not only to encounter the finished work, but to witness some of the becoming behind it.</p>
            <p>Whether he is writing psychological fiction, mystery, horror, personal reflection or something that refuses to fit neatly into a genre, David's aim remains simple: to create work that stays with the reader after the page ends — not because it explains everything, but because somewhere inside it, the reader recognizes a feeling, a question, or perhaps another version of themselves.</p>
          </div>
          <div className="ornament" style={{marginTop:44,textAlign:'left'}}>···</div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <div><div className="wordmark">DAVID//WRITES</div><p className="muted">Stories, fragments and other versions still becoming.</p></div>
          <div className="footer-links"><a href="#library">Library</a><a href="#about">About David</a><Link href="/">Home</Link></div>
          <div className="footer-copy">© {new Date().getFullYear()} David Writes. All words remain the author's.</div>
        </div>
      </footer>
    </main>
  );
}
