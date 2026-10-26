import { Bell, Home, MessageSquare, Search, UserCircle2, Users } from 'lucide-react';

const navItems = [
  { label: 'Home', icon: Home },
  { label: 'Friends', icon: Users },
  { label: 'Messages', icon: MessageSquare },
  { label: 'Notifications', icon: Bell },
  { label: 'Profile', icon: UserCircle2 }
];

const stories = [
  { name: 'Ariana', color: 'from-pink-500 to-orange-400' },
  { name: 'Jay', color: 'from-blue-500 to-cyan-400' },
  { name: 'Maya', color: 'from-violet-500 to-purple-400' },
  { name: 'Leo', color: 'from-emerald-500 to-teal-400' },
  { name: 'Sara', color: 'from-rose-500 to-red-400' }
];

const posts = [
  {
    author: 'Nia Wilson',
    handle: '@niaw',
    time: '2h ago',
    text: 'Sunset city walk. Sometimes the best stories happen when your phone stays in your pocket.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
  },
  {
    author: 'Marcus Lee',
    handle: '@marcus',
    time: '5h ago',
    text: 'Late-night coding session complete. Building the next big thing, one feature at a time.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-lg font-bold text-white">D</div>
            <div className="flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500">
              <Search className="mr-2 h-4 w-4" />
              <input
                aria-label="Search"
                className="w-40 bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Search DROP SPOT"
              />
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-brand-500"
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white">Create</button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 font-bold text-white">
              C
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="space-y-6">
          <div className="rounded-2xl bg-white p-4 shadow-soft">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-400 font-semibold text-white">
                C
              </div>
              <div>
                <p className="font-semibold">Chiraq Wiz</p>
                <p className="text-sm text-slate-500">@chiraqwiz</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p>Friends: 1,248</p>
              <p>Followers: 9,840</p>
              <p>Posts: 423</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-soft">
            <h3 className="mb-3 font-semibold">Suggested</h3>
            <div className="space-y-3">
              {['Tara', 'Noah', 'Jules'].map((name) => (
                <div key={name} className="flex items-center justify-between rounded-xl bg-slate-50 p-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-500 text-xs font-semibold text-white">
                      {name[0]}
                    </div>
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  <button className="rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">Add</button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-2xl bg-white p-4 shadow-soft">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-sm font-semibold text-white">
                C
              </div>
              <div className="flex-1 rounded-full bg-slate-100 px-4 py-3 text-slate-500">What’s on your mind?</div>
            </div>

            <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-medium text-slate-600">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 hover:bg-slate-100">Photo</button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 hover:bg-slate-100">Video</button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 hover:bg-slate-100">Feeling</button>
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4">
              {stories.map(({ name, color }) => (
                <div key={name} className="w-24 text-center">
                  <div className={`mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${color} p-[2px]`}>
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-lg font-bold text-slate-800">
                      {name[0]}
                    </div>
                  </div>
                  <p className="truncate text-xs font-medium text-slate-600">{name}</p>
                </div>
              ))}
            </div>
          </div>

          {posts.map((post) => (
            <article key={post.author} className="overflow-hidden rounded-2xl bg-white shadow-soft">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 font-semibold text-white">
                    {post.author[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{post.author}</p>
                    <p className="text-xs text-slate-500">{post.handle} • {post.time}</p>
                  </div>
                </div>
                <button className="text-xl text-slate-400">⋯</button>
              </div>

              <p className="px-4 pb-3 text-sm leading-6 text-slate-700">{post.text}</p>
              <img src={post.image} alt={post.author} className="h-80 w-full object-cover" />

              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
                <div className="flex gap-4">
                  <span>❤ 320</span>
                  <span>💬 98</span>
                  <span>↻ 28</span>
                </div>
                <span>Share</span>
              </div>
            </article>
          ))}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl bg-white p-4 shadow-soft">
            <h3 className="mb-3 font-semibold">Friend Requests</h3>
            <div className="space-y-3">
              {['Mila', 'Derek', 'Yara'].map((name) => (
                <div key={name} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-xs font-bold text-white">
                      {name[0]}
                    </div>
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-full bg-brand-500 px-2 py-1 text-xs font-semibold text-white">Confirm</button>
                    <button className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-soft">
            <h3 className="mb-3 font-semibold">Messages</h3>
            <div className="space-y-3 text-sm">
              {['Ariana: “Want to catch up later?”', 'Jay: “Design mockup is ready.”', 'Maya: “I sent the photo.”'].map((msg) => (
                <div key={msg} className="rounded-xl bg-slate-50 p-3 text-slate-600">
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
