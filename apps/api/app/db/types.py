from sqlalchemy import String
from sqlalchemy.dialects import postgresql
from sqlalchemy.types import TypeDecorator


class IPv4CIDRType(TypeDecorator):
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(postgresql.CIDR())
        return dialect.type_descriptor(String(43))


class IPv4InetType(TypeDecorator):
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(postgresql.INET())
        return dialect.type_descriptor(String(45))
