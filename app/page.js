import Link from 'next/link';
import { listBooks } from './lib/db';
import LibraryBrowser from './components/LibraryBrowser';
import SubscribeForm from './components/SubscribeForm';

export const dynamic='force-dynamic';

export default async function HomePage(){
 const books=await listBooks();
 return <main>
  <header className="site-header"><div className="shell site-header-inner"><Link className="wordmark" href="/">David Writes</Link><nav className="nav"><a href="#library">The Shelf</a><a href="#about">About David</a><a href="#subscribe">Subscribe</a></nav></div></header>
  <section className="hero"><div className="eyebrow">a home for stories told slowly</div><h1>Where stories<br/><em>breathe.</em></h1><p>Every page turns like film — paced, lit, and quiet in the right places. Step into a chapter and read the way it was meant to be watched.</p><a className="hero-cta" href="#library">Begin reading <span>→</span></a></section>
  <section id="library" className="section shell"><div className="section-head"><div className="eyebrow">the shelf</div><h2>Every title, pulled forward when you reach for it.</h2><p>A living shelf for finished stories, works in progress, and the versions still becoming.</p></div><LibraryBrowser books={books}/></section>
  <section id="about" className="section shell"><div className="section-head"><div className="eyebrow">behind the words</div><h2>About David</h2></div><div className="about-copy"><p>David is a Nigerian writer, creative technologist and designer whose work lives somewhere between imagination, introspection and the quiet questions people often carry without saying aloud.</p><p>His stories are drawn toward memory, identity, fear, hope, relationships, inner conflict and the strange distance between the life we imagined and the life we eventually find ourselves living. Some arrive as fiction. Others begin as fragments, reflections or uncomfortable “what ifs.”</p><p>David Writes is a living library rather than a polished shelf of finished books. Stories can appear chapter by chapter, change as they grow, disappear back into drafts and return in another form.</p><p>Whether he is writing psychological fiction, mystery, horror, personal reflection or something that refuses to fit neatly into a genre, the aim is simple: create work that stays with the reader after the page ends.</p></div></section>
  <section id="subscribe" className="section shell"><div className="subscribe-card"><div className="eyebrow">stay with the story</div><h2>Your next chapter is <em style={{color:'var(--gold-bright)'}}>already waiting.</em></h2><p>Subscribe once and David Writes will email you whenever a new book or chapter is published.</p><SubscribeForm/></div></section>
  <footer className="site-footer"><div className="shell footer-inner"><span>David Writes</span><div className="footer-links"><a href="#library">The Shelf</a><a href="#about">About</a><a href="#subscribe">Subscribe</a></div><span className="footer-copy">Stories, told the long way · © {new Date().getFullYear()}</span></div></footer>
 </main>
}