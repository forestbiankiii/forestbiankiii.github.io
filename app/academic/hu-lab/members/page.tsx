import Link from "next/link";
import { withBasePath } from "@/components/sitePath";
import { HU_LAB_MEMBER_GROUPS } from "./members";

export default function HuLabMembersPage() {
  return (
    <main className="hu-lab-page hu-lab-members-page">
      <nav className="hu-lab-nav" aria-label="课题组成员页面导航">
        <div className="hu-lab-shell hu-lab-nav__inner">
          <Link
            className="hu-lab-brand"
            href={withBasePath("/academic/hu-lab")}
            aria-label="返回胡津铭课题组主页"
          >
            <span className="hu-lab-brand__mark" aria-hidden="true">
              JH
            </span>
            <span>
              <strong>HU LAB</strong>
              <small>OPTICAL INTELLIGENCE</small>
            </span>
          </Link>

          <div className="hu-lab-nav__links">
            <Link href={withBasePath("/academic/hu-lab")}>课题组主页</Link>
            <a href="#member-directory" aria-current="page">
              成员名录
            </a>
          </div>

          <Link
            className="hu-lab-nav__back"
            href={withBasePath("/academic/hu-lab")}
          >
            返回课题组主页
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </nav>

      <header className="hu-lab-members-hero">
        <div className="hu-lab-members-hero__grid" aria-hidden="true" />
        <div className="hu-lab-shell hu-lab-members-hero__inner">
          <div>
            <p>PEOPLE / 课题组成员</p>
            <h1>和光一起成长</h1>
          </div>
          <div className="hu-lab-members-hero__aside">
            <strong>10</strong>
            <span>STUDENTS · 2026</span>
            <p>
              硕士研究生与本科生共同参与材料制备、激光加工、光学实验与计算研究。
            </p>
          </div>
        </div>
      </header>

      <section
        id="member-directory"
        className="hu-lab-members-directory"
        aria-label="课题组成员名录"
      >
        <div className="hu-lab-shell">
          <div className="hu-lab-members-directory__intro">
            <p>MEMBER DIRECTORY / 独立成员页</p>
            <span>
              每位成员均已预留个人照片和资料栏；补充信息后即可直接替换占位内容。
            </span>
          </div>

          {HU_LAB_MEMBER_GROUPS.map((group, groupIndex) => (
            <section
              key={group.label}
              className="hu-lab-members-directory__group"
              aria-labelledby={`member-group-${groupIndex + 1}`}
            >
              <div className="hu-lab-members-directory__group-header">
                <span>{String(groupIndex + 1).padStart(2, "0")}</span>
                <div>
                  <p>{group.english}</p>
                  <h2 id={`member-group-${groupIndex + 1}`}>{group.label}</h2>
                </div>
                <strong>{String(group.members.length).padStart(2, "0")}</strong>
              </div>

              <div className="hu-lab-person-grid">
                {group.members.map((person) => (
                  <article key={person.name} className="hu-lab-person-card">
                    <div className="hu-lab-person-card__photo">
                      {person.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={withBasePath(person.photo)}
                          alt={`${person.name}个人照片`}
                        />
                      ) : (
                        <span>
                          <i aria-hidden="true">＋</i>
                          照片待补充
                        </span>
                      )}
                    </div>

                    <div className="hu-lab-person-card__body">
                      <p>HU LAB · MEMBER</p>
                      <h3>{person.name}</h3>
                      <dl>
                        <div>
                          <dt>研究方向</dt>
                          <dd>
                            {person.research || (
                              <span className="hu-lab-info-placeholder">待补充</span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt>联系方式</dt>
                          <dd>
                            {person.contact || (
                              <span className="hu-lab-info-placeholder">待补充</span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt>个人简介</dt>
                          <dd>
                            {person.bio || (
                              <span className="hu-lab-info-placeholder">待补充</span>
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <footer className="hu-lab-footer">
        <div className="hu-lab-shell hu-lab-footer__inner">
          <p>HU LAB · MEMBER DIRECTORY</p>
          <Link href={withBasePath("/academic/hu-lab")}>返回课题组主页 ↑</Link>
        </div>
      </footer>
    </main>
  );
}
